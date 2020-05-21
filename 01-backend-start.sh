#!/bin/sh

SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")

cd "$SCRIPTPATH/backend"
npm install
npm run build
pm2 stop secrets-backend
pm2 delete secrets-backend
pm2 start npm -n "secrets-backend" -e "$SCRIPTPATH/logs/backend.pm2.error.log" -- start

