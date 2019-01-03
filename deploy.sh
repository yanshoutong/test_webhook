#! /bin/sh

echo "** deploy **  $*"

#
# Exit Code:
# ----------
#   0 : everything goes well
#   1 : argument error
#   2 : failed to create $REPO folder
#   3 : failed to do 'git clone $CODEBASE'
#   4 : failed to checkout $remote_branch
#   5 : failed to run 'npm install'
#   6 : smoke test failed
#

CODEBASE="https://github.com/yanshoutong/test_webhook.git"
REPO=.repo

#
# argument error checking
if [ $# != 3 ]; then
    echo "arguments missing"
    exit 1
fi

remote_branch=$3

#
# make sure $REPO folder exists, create it if needed
if [ ! -d $REPO ]; then
    echo "$REPO folder does not exist, create it"
    mkdir $REPO
    if [ $? -ne 0 ]; then
        echo "failed to create $REPO folder"
        exit 2
    fi
fi

#
# change working dir to $REPO and do cleanup if needed
cd $REPO
rm -rf *


#
# git clone $remote_branch
echo "start to clone $remote_branch"
git clone $CODEBASE code
if [ $? -ne 0 ]; then
    echo "failed to clone $CODEBASE"
    exit 3
fi

#
# change working dir to code underneath $CODEBASE
cd code
# checkout $remote_branch
git checkout -b $remote_branch devops 
if [ $? -ne 0 ]; then
    echo "failed to checkout $remote_branch"
    exit 4
fi

#
# npm install
echo "start to npm install..."
npm install
if [ $? -ne 0 ]; then
    echo "failed to do npm install"
    exit 5
fi

#
# do smoke testing
echo "start to do smoke tests..."
node smoke
if [ $? -ne 0 ]; then
    echo "smoke test failed exit code is $?"
    exit 6
fi

echo "smoke test passed"
exit 0
