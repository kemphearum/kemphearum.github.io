#!/bin/bash
git filter-branch --force --env-filter '
if [ "$GIT_AUTHOR_EMAIL" = "49699333+dependabot[bot]@users.noreply.github.com" ]; then
    export GIT_AUTHOR_NAME="kemphearum"
    export GIT_AUTHOR_EMAIL="kem.phearum@gmail.com"
fi
if [ "$GIT_COMMITTER_EMAIL" = "49699333+dependabot[bot]@users.noreply.github.com" ]; then
    export GIT_COMMITTER_NAME="kemphearum"
    export GIT_COMMITTER_EMAIL="kem.phearum@gmail.com"
fi
' --msg-filter '
sed -e "/Co-Authored-By: Claude/d" -e "/Co-authored-by: Claude/d" -e "/Co-authored-by: dependabot/d"
' --tag-name-filter cat -- --all
