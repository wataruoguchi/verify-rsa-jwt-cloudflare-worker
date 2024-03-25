import * as dotenv from "dotenv";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";
import * as path from "path";
import { pem2jwk } from "pem-jwk";

dotenv.config();

const KEY_ID = "matching-kid";

// Replace with your actual RSA private key
function getPrivatePem() {
  const privatePemFileName = `${process.env.PEM_NAME}.pem`;
  // Please run `gen-pem-key` script to generate the RSA key pair
  return fs.readFileSync(path.resolve(process.cwd(), privatePemFileName));
}

// Read the PEM public key from 'public.pem' file
function getPublicPemStr() {
  const publicPemFileName = `${process.env.PEM_NAME}.pub.pem`;
  // Please run `gen-pem-key` script to generate the RSA key pair
  return fs.readFileSync(
    path.resolve(process.cwd(), publicPemFileName),
    "utf8",
  );
}

export function getJwk() {
  // Convert PEM public key to JWK format
  return pem2jwk(getPublicPemStr(), {
    alg: "RS256",
    use: "sig",
    kid: KEY_ID,
  });
}

export function getToken(
  payload: {
    sub?: string;
    name?: string;
  },
  keyid?: string,
) {
  return jwt.sign(payload, getPrivatePem(), {
    algorithm: "RS256",
    keyid: keyid || KEY_ID,
  });
}
