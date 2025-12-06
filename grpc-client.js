const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.resolve(__dirname, './src/auth.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH);
const grpcObject = grpc.loadPackageDefinition(packageDef);
const auth = grpcObject.auth; 

const client = new auth.AuthService('localhost:50051', grpc.credentials.createInsecure());

const op = process.argv[2] || 'signup';

async function run() {
  if (op === 'signup') {
    client.Signup({ email: 'grpc-test@example.com', password: process.env.TEST_PASSWORD }, (err, res) => {
      if (err) return console.error('Signup error', err);
      console.log('Signup response', res);
    });
  } else if (op === 'login') {
    client.Login({ email: 'grpc-test@example.com', password: process.env.TEST_PASSWORD }, (err, res) => {
      if (err) return console.error('Login error', err);
      console.log('Login response', res);
    });
  } else if (op === 'verify') {
    const token = process.argv[3] || '';
    if (!token) return console.error('Usage: node grpc-client.js verify <token>');
    client.VerifyToken({ token }, (err, res) => {
      if (err) return console.error('VerifyToken error', err);
      console.log('Verify response', res);
    });
  } else {
    console.error('Unknown op:', op);
  }
}

run();
