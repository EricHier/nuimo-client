#!/bin/bash

sudo pkill -f nuimo.js
sudo nohup npm run start >/dev/null 2>&1 & 