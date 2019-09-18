#!/usr/bin/env bash

# Decompress application bundle
tar -zxf ~/loving-spoonful.tar.gz

# Install Dependencies
cd ~/bundle/programs/server
sudo npm install > /dev/null

# Fix Permissions
sudo chown -R lsapp:lsapp /home/lsapp

# Restart Service
sudo systemctl restart lsapp
