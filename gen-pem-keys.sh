#!/bin/sh
set -a; source .env; set +a
if [ -z "${PEM_NAME}" ]
then
    echo "PEM_NAME is not set. Please add it in .env file."
else
    PRIVATE_PEM_NAME="${PEM_NAME}.pem"
    PUBLIC_PEM_NAME="${PEM_NAME}.pub.pem"
    
    openssl genrsa -out "${PRIVATE_PEM_NAME}" 2048
    openssl rsa -in "${PRIVATE_PEM_NAME}" -pubout -out "${PUBLIC_PEM_NAME}"
    echo "DONE! Private key: ${PRIVATE_PEM_NAME}, Public key: ${PUBLIC_PEM_NAME}"
fi