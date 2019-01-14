#! /bin/sh

echo "** deploy **"  
echo "==> $*"

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

REPO=.repo

#
# argument error checking
if [ $# != 3 ]; then
    echo "arguments missing"
    exit 1
fi


#
# make sure $REPO folder exists, create it if needed
if [ ! -d $REPO ]; then
    echo "$REPO folder does not exist, create it"
    echo '$' mkdir $REPO
    mkdir $REPO
    if [ $? -ne 0 ]; then
        echo "failed to create $REPO folder"
        exit 2
    fi
fi

# change working dir to $REPO and do cleanup if needed
echo '$' cd $REPO
cd $REPO
echo '$' rm -rf *
rm -rf *

(cd ..; ls -l smoke.js)
echo '$' node ../smoke.js
node ../smoke.js
smokeExitCode=$?
if [ $smokeExitCode -ne 0 ]; then
    echo "smoke test failed exit code is $smokeExitCode"
    exit 6
fi

echo "smoke test passed"
exit 0
