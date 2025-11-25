FROM ubuntu:latest
LABEL authors="Santiago"

ENTRYPOINT ["top", "-b"]