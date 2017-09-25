echo This will create a loving-spoonful-build folder in the parent directory of the current one.

pause

echo
echo --- Building ---

rmdir ..\loving-spoonful-build /s
mkdir ..\loving-spoonful-build
meteor build ..\loving-spoonful-build --server-only --server carrot.lovingspoonful.org

echo --- Copying to Server ---
pscp -scp lsapp@66.228.44.6:~ ..\loving-spoonful-build\loving-spoonful.tar.gz

echo --- Connecting to Server ---
plink lsapp@66.228.44.6 -m deploy_on_server.sh
