#! /bin/sh

echo "** deploy **  $*"

#
# Exit Code:
# ----------
#   0 : everything goes well
#   1 : argument error
#

CODEBASE="https://github.com/yanshoutong/test_webhook.git"
REPO=.repo

if [ $# != 3 ]; then
    echo "arguments missing"
    exit 1
fi

remote_branch=$3

if [ ! -d $REPO ]; then
    echo "$REPO folder does not exist, create it"
    mkdir $REPO
fi

cd $REPO
rm -rf *

echo "start to clone $remote_branch"
git clone $CODEBASE code
cd code
git checkout --track $remote_branch
npm install
node smoke
exit $?
