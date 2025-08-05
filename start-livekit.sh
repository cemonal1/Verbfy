#!/bin/bash

echo "Starting LiveKit Server for Verbfy..."
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed or not running."
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
    echo "Then start Docker Desktop and run this script again."
    exit 1
fi

echo "Starting LiveKit server on localhost:7880..."
echo "API Key: uc4eRZW1iYWcX2UXeoQ/v1JJ/ackt/qelbFiatS/WwM="
echo "API Secret: 1M2k3w3MV/PMZIvB2tANCZ0ZXcw93hhkV4N7eyW+QNQ="
echo
echo "Press Ctrl+C to stop the server"
echo

docker run --rm -p 7880:7880 -p 7881:7881 -p 7882:7882/udp \
  -e LIVEKIT_KEYS=uc4eRZW1iYWcX2UXeoQ/v1JJ/ackt/qelbFiatS/WwM=:1M2k3w3MV/PMZIvB2tANCZ0ZXcw93hhkV4N7eyW+QNQ= \
  livekit/livekit-server --dev --node-ip=0.0.0.0 