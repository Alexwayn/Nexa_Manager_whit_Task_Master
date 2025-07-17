import React from 'react';
import { Link } from 'react-router-dom';

export default function TestRoute() {
  return (
    <div className='p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md'>
      <h1 className='text-2xl font-bold text-blue-600 mb-4'>Test Route</h1>
      <p className='mb-4'>
        This is a non-protected route for testing. If you can see this, basic routing is working.
      </p>

      <div className='bg-blue-50 p-4 rounded-lg mb-6'>
        <h2 className='text-xl font-semibold mb-2'>React Router Status</h2>
        <p className='text-green-600 font-semibold'>✅ React Router is working correctly!</p>
      </div>

      <div className='space-y-4'>
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h2 className='text-lg font-semibold mb-2'>Routing Tests</h2>
          <ul className='list-disc pl-5 space-y-2'>
            <li>
              <Link to='/login' className='text-blue-600 hover:text-blue-800 underline'>
                Go to Login Page
              </Link>
            </li>
            <li>
              <Link to='/dashboard' className='text-blue-600 hover:text-blue-800 underline'>
                Go to Dashboard (Protected Route)
              </Link>
            </li>
            <li>
              <Link to='/test-debug' className='text-blue-600 hover:text-blue-800 underline'>
                Test Debug Page
              </Link>
            </li>
          </ul>
        </div>

        <div className='bg-yellow-50 p-4 rounded-lg'>
          <h2 className='text-lg font-semibold mb-2'>Static Test Pages</h2>
          <ul className='list-disc pl-5 space-y-2'>
            <li>
              <a
                href='/test.html'
                className='text-blue-600 hover:text-blue-800 underline'
                target='_blank'
                rel='noopener noreferrer'
              >
                Simple Vite Server Test
              </a>
            </li>
            <li>
              <a
                href='/debug.html'
                className='text-blue-600 hover:text-blue-800 underline'
                target='_blank'
                rel='noopener noreferrer'
              >
                Debug Console Test
              </a>
            </li>
            <li>
              <a
                href='/simple.html'
                className='text-blue-600 hover:text-blue-800 underline'
                target='_blank'
                rel='noopener noreferrer'
              >
                Simple React Test
              </a>
            </li>
            <li>
              <a
                href='/login-test.html'
                className='text-blue-600 hover:text-blue-800 underline'
                target='_blank'
                rel='noopener noreferrer'
              >
                Supabase Login Test
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
