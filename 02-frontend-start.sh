#!/bin/sh

SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")

cd "$SCRIPTPATH/frontend"
npm install
npm run build
pm2 stop secrets-frontent
pm2 delete secrets-frontend
pm2 start npm -n "secrets-frontend" -e "$SCRIPTPATH/logs/frontend.pm2.error.log" -- start

