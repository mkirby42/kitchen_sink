# Roll back a release

A green production deploy on `main` tags the commit CI just deployed and opens a GitHub Release named `release-YYYY-MM-DD-N` (UTC, `-1` then `-2` if more than one lands that day). Notes are the commits since the previous release.

The tag is the commit whose deploy hook returned success. Vercel can still be building for a minute after the tag appears. Match the release's commit SHA to the deployment before you roll back.

## Vercel instant rollback

1. Open the Kitchen Sink project in Vercel → Deployments.
2. Find the deployment whose commit is the release tag (`release-2026-10-22-1`, or whatever you are going back to). The tag page on GitHub shows the SHA.
3. Open that deployment and use **Instant Rollback**. Production starts serving that build. No new commit.

That is the one to use when the current production build is wrong and the older build is still in the deployment list.

## Redeploy the tag

Use this when the old deployment is gone, or you want production to build that commit again.

1. Check out the tag: `git fetch origin tag release-2026-10-22-1 && git checkout release-2026-10-22-1`.
2. Redeploy that commit from Vercel (Deployments → the old deployment → Redeploy), or deploy the checked-out tag with the Vercel CLI if you already use it.

Do not reset `main` just to roll production back. Instant Rollback leaves `main` where it is. Fix forward, or revert commits on `main`, when you want the git history to match production again.
