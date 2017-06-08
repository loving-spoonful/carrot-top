echo This will create a loving-spoonful-build folder in the parent directory of the current one.

pause

rmdir ..\loving-spoonful-build /s
mkdir ..\loving-spoonful-build
meteor build ..\loving-spoonful-build --server-only --server carrot.lovingspoonful.org
pscp -scp lsapp@66.228.44.6:~
plink lsapp@MachineB -m deploy_on_server.sh
