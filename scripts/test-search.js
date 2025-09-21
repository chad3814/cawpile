#!/usr/bin/env node

/**
 * Simple script to test the search API endpoints
 * Run with: node scripts/test-search.js
 */

async function testSearch() {
  const baseUrl = 'http://localhost:3000'
  const testQuery = 'harry potter'

  console.log('🔍 Testing search API with query:', testQuery)
  console.log('⚠️  Note: This test requires the dev server to be running (npm run dev)')
  console.log('⚠️  And you must be logged in to the application\n')

  try {
    // First, check if the server is running
    const healthCheck = await fetch(baseUrl).catch(() => null)
    if (!healthCheck) {
      console.error('❌ Server is not running. Start it with: npm run dev')
      process.exit(1)
    }

    // Note: This will likely return 401 Unauthorized without a valid session
    // For proper testing, use the UI after logging in
    const response = await fetch(`${baseUrl}/api/books/search?q=${encodeURIComponent(testQuery)}&limit=5`)

    console.log('📡 Response status:', response.status)

    if (response.status === 401) {
      console.log('🔐 Authentication required. Please test through the UI after logging in.')
      console.log('\nTo test manually:')
      console.log('1. Start the dev server: npm run dev')
      console.log('2. Login to the application')
      console.log('3. Navigate to the search functionality')
      console.log('4. Search for books - results will now come from all 4 sources:')
      console.log('   - Local Database (weight: 10)')
      console.log('   - Hardcover (weight: 6)')
      console.log('   - Google Books (weight: 5)')
      console.log('   - IBDB (weight: 4)')
      return
    }

    const data = await response.json()
    console.log('📚 Response data:', JSON.stringify(data, null, 2))

    if (data.books && Array.isArray(data.books)) {
      console.log(`\n✅ Found ${data.books.length} books`)
      data.books.forEach((book, index) => {
        console.log(`\n${index + 1}. ${book.title}`)
        console.log(`   Authors: ${book.authors?.join(', ') || 'Unknown'}`)
        console.log(`   ISBN: ${book.isbn13 || book.isbn10 || 'No ISBN'}`)
      })
    }

  } catch (error) {
    console.error('❌ Error testing search:', error)
  }
}

console.log('==========================================')
console.log('   Book Search API Test Script')
console.log('==========================================\n')

testSearch()