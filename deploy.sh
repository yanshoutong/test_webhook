#! /bin/sh

echo "** deploy ** " $*

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
echo "start to clone $remote_branch"




