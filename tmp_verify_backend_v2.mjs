import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Product from './src/backend/models/Product.js';
import ProductVariant from './src/backend/models/ProductVariant.js';
import ProductController from './src/backend/controllers/ProductController.js';

// Setup Mock for fs.promises.unlink
const unlinkedPaths = [];
fs.promises.unlink = async (p) => {
  unlinkedPaths.push(path.normalize(p));
  return Promise.resolve();
};

const runTests = async () => {
  console.log('--- STARTING ITERATION 2 BACKEND VERIFICATION ---');

  // Test 1: updateProduct image diff leak prevention
  console.log('\n[Test 1] Testing image leak prevention on product update...');
  unlinkedPaths.length = 0; // reset

  // Stub Product methods for updateProduct
  Product.findById = async (id) => {
    return {
      _id: id,
      imageUrl: [
        { imageUrl: '/uploads/old-leak.jpg' },
        { imageUrl: '/uploads/keep-safe.jpg' }
      ]
    };
  };
  Product.findByIdAndUpdate = async (id, data, options) => {
    return { _id: id, ...data };
  };

  const mockRes = {
    status: (code) => ({
      json: (data) => {
        // console.log('Response status:', code, data);
      }
    })
  };

  const nextSpy = (err) => {
    if (err) console.error('Test error callback:', err);
  };

  const reqUpdate = {
    params: { id: 'prod123' },
    body: {
      product: JSON.stringify({
        name: 'Updated Product Name',
        imageUrl: ['/uploads/keep-safe.jpg', '/uploads/new-upload.jpg'] // old-leak.jpg is dropped
      })
    }
  };

  await ProductController.updateProduct(reqUpdate, mockRes, nextSpy);

  const leakedPath = path.resolve(process.cwd(), 'uploads', 'old-leak.jpg');
  const keptPath = path.resolve(process.cwd(), 'uploads', 'keep-safe.jpg');

  const leakedDeleted = unlinkedPaths.includes(leakedPath);
  const keptDeleted = unlinkedPaths.includes(keptPath);

  if (leakedDeleted && !keptDeleted) {
    console.log('✅ Test 1 Passed: Old orphaned image file detected and deleted. Kept image not affected.');
  } else {
    console.error('❌ Test 1 Failed: Orphaned image file not deleted or kept image was deleted!', {
      unlinkedPaths,
      expectedToExclude: keptPath,
      expectedToInclude: leakedPath
    });
  }

  // Test 2: deleteProduct session transactions & standalone fallback
  console.log('\n[Test 2] Testing deleteProduct transaction session flow...');
  let sessionCreated = false;
  let sessionEnded = false;
  let transactionStarted = false;
  let transactionAborted = false;

  mongoose.startSession = async () => {
    sessionCreated = true;
    return {
      withTransaction: async (fn) => {
        transactionStarted = true;
        await fn();
      },
      endSession: async () => {
        sessionEnded = true;
      }
    };
  };

  Product.findById = async () => ({
    _id: 'test-id-delete',
    imageUrl: []
  });

  ProductVariant.find = () => ({
    session: () => Promise.resolve([])
  });

  ProductVariant.deleteMany = async () => {};
  Product.findByIdAndDelete = async () => {};

  await ProductController.deleteProduct({ params: { id: 'test-id-delete' } }, mockRes, nextSpy);

  if (sessionCreated && transactionStarted && sessionEnded) {
    console.log('✅ Test 2 Passed: Mongoose Transaction session opened, transaction completed, session closed.');
  } else {
    console.error('❌ Test 2 Failed: Transaction boundary was not established correctly.', {
      sessionCreated,
      transactionStarted,
      sessionEnded
    });
  }

  console.log('\n--- ITERATION 2 BACKEND VERIFICATION COMPLETE ---');
};

runTests().catch(err => {
  console.error('Validation script crash:', err);
});
