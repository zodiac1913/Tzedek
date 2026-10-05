#!/usr/bin/env bash
# Syncs the runtime from the latest Tzedek GitHub release into the served workspace.
# Run in the Tzedek code-server terminal; requires curl and a ZIP extractor.
set -euo pipefail

WEB_ROOT="${TZEDEK_WEB_ROOT:-/config/workspace}"
REPO="zodiac1913/Tzedek"
STAMP_FILE="$WEB_ROOT/.tzedek-release"

# Slim containers often ship none of these, so try each in turn.
extract_zip() {
  local zip_path="$1" dest_dir="$2"
  mkdir -p "$dest_dir"
  if command -v unzip >/dev/null 2>&1; then
    unzip -q "$zip_path" -d "$dest_dir"
  elif command -v python3 >/dev/null 2>&1; then
    python3 -m zipfile -e "$zip_path" "$dest_dir"
  elif command -v bsdtar >/dev/null 2>&1; then
    bsdtar -xf "$zip_path" -C "$dest_dir"
  elif command -v perl >/dev/null 2>&1 && perl -MIO::Uncompress::Unzip -MFile::Path -MFile::Basename -e 1 >/dev/null 2>&1; then
    perl -MIO::Uncompress::Unzip -MFile::Path=make_path -MFile::Basename=dirname -e '
      use strict;
      use warnings;
      my ($archive, $destination) = @ARGV;
      my $zip = IO::Uncompress::Unzip->new($archive)
        or die "Cannot open ZIP: $IO::Uncompress::Unzip::UnzipError\n";
      for (;;) {
        my $name = $zip->getHeaderInfo->{Name};
        if (($name eq "page/smlCompliance.js"
            || $name eq "page/smlComplianceBootstrap.js"
            || $name eq "page/smlComplianceRunner.js"
            || $name eq "page/compliance-bookmarklet.html"
            || $name eq "page/compliance-bookmarklet.js"
            || $name eq "page/index.html"
            || $name eq "page/wcag-demo.html"
            || $name eq "page/wcag-demo.js"
            || $name =~ m{\Apage/assets/})
            && $name !~ m{(?:\A|/)\.\.?(?:/|\z)}
            && $name !~ m{/\z}) {
          my $file = "$destination/$name";
          make_path(dirname($file));
          open my $output, ">", $file or die "Cannot write $file: $!\n";
          binmode $output;
          while (1) {
            my $bytes = $zip->read(my $buffer, 65536);
            die "Cannot read $name: $IO::Uncompress::Unzip::UnzipError\n"
              unless defined $bytes && $bytes >= 0;
            last if $bytes == 0;
            print {$output} $buffer or die "Cannot write $file: $!\n";
          }
          close $output or die "Cannot close $file: $!\n";
        }
        last unless $zip->nextStream();
      }
    ' "$zip_path" "$dest_dir"
  else
    echo "Need unzip, python3, bsdtar, or Perl IO::Uncompress::Unzip to extract the release zip" >&2
    exit 1
  fi
}

if [ ! -d "$WEB_ROOT" ]; then
  echo "Tzedek workspace $WEB_ROOT does not exist. Set TZEDEK_WEB_ROOT to the served directory." >&2
  exit 1
fi

latest_tag="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
  | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -1)"

if [ -z "$latest_tag" ]; then
  echo "Could not resolve the latest release tag for $REPO" >&2
  exit 1
fi

current_tag="$(cat "$STAMP_FILE" 2>/dev/null || true)"
if [ "$latest_tag" = "$current_tag" ] && [ "${TZEDEK_FORCE_DEPLOY:-0}" != "1" ]; then
  echo "Already serving $latest_tag"
  exit 0
fi

work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

curl -fsSL -o "$work_dir/Tzedek.zip" \
  "https://github.com/$REPO/releases/download/$latest_tag/Tzedek.zip"
extract_zip "$work_dir/Tzedek.zip" "$work_dir/unpacked"

runtime_dir="$work_dir/unpacked/page"
if [ ! -f "$runtime_dir/smlComplianceRunner.js" ] || [ ! -f "$runtime_dir/smlCompliance.js" ] || [ ! -f "$runtime_dir/compliance-bookmarklet.html" ] || [ ! -d "$runtime_dir/assets" ]; then
  echo "Release $latest_tag is missing runtime files, installer, or assets, refusing to deploy" >&2
  exit 1
fi
if [ ! -f "$runtime_dir/index.html" ] || [ ! -f "$runtime_dir/wcag-demo.html" ] || [ ! -f "$runtime_dir/compliance-bookmarklet.js" ] || [ ! -f "$runtime_dir/wcag-demo.js" ] || [ ! -f "$runtime_dir/assets/issue-guide.js" ] || [ ! -f "$runtime_dir/smlComplianceBootstrap.js" ]; then
  echo "Release $latest_tag is missing pages or their scripts, refusing to deploy" >&2
  exit 1
fi

# Deploy standalone pages without changing the extension's relative resource base.
mkdir -p "$WEB_ROOT/assets"
cp "$runtime_dir/smlComplianceRunner.js" "$runtime_dir/smlCompliance.js" "$runtime_dir/smlComplianceBootstrap.js" "$runtime_dir/compliance-bookmarklet.html" "$WEB_ROOT/"
cp "$runtime_dir/compliance-bookmarklet.js" "$runtime_dir/wcag-demo.js" "$WEB_ROOT/"
for page in index.html wcag-demo.html; do
  sed 's|<base href="./">|<base href="/tzedek/">|' "$runtime_dir/$page" >"$WEB_ROOT/$page"
done
cp -R "$runtime_dir/assets/." "$WEB_ROOT/assets/"

printf '%s\n' "$latest_tag" >"$STAMP_FILE"
echo "Deployed $latest_tag to $WEB_ROOT"
