#!/bin/sh

docker-compose up npm_install
docker-compose up -d
open http://localhost:5173
