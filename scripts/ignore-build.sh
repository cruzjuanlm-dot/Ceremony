#!/bin/sh
# Vercel "Ignored Build Step": exit 0 = skip the build, exit 1 = build.
# Production always builds. Previews skip when nothing Ceremony depends on
# changed since the last deployed commit.
[ "$VERCEL_ENV" = production ] && exit 1
[ -z "$VERCEL_GIT_PREVIOUS_SHA" ] && exit 1
git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- . ../src/components/ui ../src/lib/utils.ts ../src/hooks ../src/styles.css ../src/components/page-header.tsx ../src/components/cell-control-classes.ts ../bun.lock
