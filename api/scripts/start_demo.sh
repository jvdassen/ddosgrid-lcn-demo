#!/bin/bash
export PORT=8080
export CLIENT_APP_ORIGIN=http://10.0.1.2:8081
export OAUTH2_SUCCESS_FORWARD=http://10.0.1.2:8081/ddosgrid
export OAUTH2_AUTHORIZE=https://www.csg.uzh.ch/ddosgrid/ddosdb/o/authorize/
export OAUTH2_TOKEN=https://www.csg.uzh.ch/ddosgrid/ddosdb/o/token/
export OAUTH2_CLIENTID=xBhNnrt8OKTgnCSwg0PYl2sdWIaDnk212xC9x7r1
export OAUTH2_CLIENTSECRET=FLObnDmKr182EpvtaeRRwfggL7XcPfzouC3eQ7yIhTVYodQ5BVi05HpopGRSJi00vdEgzdeKbZbMys7GFAUx9FncJFtgcVP87ZkGFYmdqEh1FlW2fW6j9Fzqvj6n6JXj
export OAUTH2_CALLBACK=http://10.0.1.2:8080/auth/provider/callback/
export DDOSDB_PROFILEINFO=https://www.csg.uzh.ch/ddosgrid/ddosdb/api/profileinfo
export DDOSDB_PCAPEXPORT=https://www.csg.uzh.ch/ddosgrid/ddosdb/
export DDOSDB_ATTACKTRACE_PATH=https://www.csg.uzh.ch/ddosgrid/ddosdb/api/attack-trace
export DDOSDB_FILTEREXPORT=https://www.csg.uzh.ch/ddosgrid/ddosdb/api/upload-filter_rules
export DDOSDB_HOST=www.csg.uzh.ch

node index.js
