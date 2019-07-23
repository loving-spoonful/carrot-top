#!/usr/bin/env bash

echo "This will create a loving-spoonful-build folder in the parent directory of the current one."
read -n1 -r -p "Press any key to continue..."
echo
echo "--- Building ---"

rm -r ../loving-spoonful-build
mkdir ../loving-spoonful-build
meteor build ../loving-spoonful-build --server-only --server meatup.lovingspoonful.org
echo "--- Copying to Server ---"
scp ../loving-spoonful-build/loving-spoonful.tar.gz lsapp@66.228.44.6:~
echo "--- Connecting to Server ---"
ssh lsapp@66.228.44.6 /bin/bash <<'ENDSSH'
# Decompress application bundle
tar -zxf ~/loving-spoonful.tar.gz

# Install Dependencies
cd ~/bundle/programs/server
sudo npm install > /dev/null

# Fix Permissions
sudo chown -R lsapp:lsapp /home/lsapp

# Restart Service
sudo systemctl restart lsapp
ENDSSH
echo "Finished."
