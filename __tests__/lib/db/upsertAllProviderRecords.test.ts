/**
 * @jest-environment node
 */

import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'
import { upsertAllProviderRecords } from '@/lib/db/books'
import type { SourceEntry } from '@/lib/search/types'

const prisma = new PrismaClient()

describe('upsertAllProviderRecords', () => {
  let testBookId: string
  let testEditionId: string

  beforeAll(async () => {
    // Create test book
    const book = await prisma.book.create({
      data: {
        title: `Test Book UpsertAll ${nanoid(6)}`,
        authors: ['Test Author'],
      },
    })
    testBookId = book.id

    // Create test edition
    const edition = await prisma.edition.create({
      data: {
        bookId: book.id,
        isbn13: `978${nanoid(10)}`,
      },
    })
    testEditionId = edition.id
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.googleBook.deleteMany({
      where: { editionId: testEditionId },
    })
    await prisma.hardcoverBook.deleteMany({
      where: { editionId: testEditionId },
    })
    await prisma.ibdbBook.deleteMany({
      where: { editionId: testEditionId },
    })
    await prisma.edition.deleteMany({
      where: { bookId: testBookId },
    })
    await prisma.book.deleteMany({
      where: { id: testBookId },
    })
    await prisma.$disconnect()
  })

  afterEach(async () => {
    // Clean up provider records after each test
    await prisma.googleBook.deleteMany({
      where: { editionId: testEditionId },
    })
    await prisma.hardcoverBook.deleteMany({
      where: { editionId: testEditionId },
    })
    await prisma.ibdbBook.deleteMany({
      where: { editionId: testEditionId },
    })
  })

  test('should create records for all three providers when sources contain all three', async () => {
    const sources: SourceEntry[] = [
      {
        provider: 'google',
        data: {
          id: 'google-test-123',
          googleId: 'google-test-123',
          title: 'Test Book',
          authors: ['Test Author'],
          description: 'A test description from Google',
          source: 'google',
          sourceWeight: 5,
          categories: [],
        },
      },
      {
        provider: 'hardcover',
        data: {
          id: 'hardcover-test-123',
          googleId: '',
          title: 'Test Book',
          authors: ['Test Author'],
          description: 'A test description from Hardcover',
          source: 'hardcover',
          sourceWeight: 6,
          categories: [],
        },
      },
      {
        provider: 'ibdb',
        data: {
          id: 'ibdb-test-123',
          googleId: '',
          title: 'Test Book',
          authors: ['Test Author'],
          description: 'A test description from IBDB',
          source: 'ibdb',
          sourceWeight: 4,
          categories: [],
        },
      },
    ]

    const result = await upsertAllProviderRecords(testEditionId, sources)

    expect(result.google).toBe('created')
    expect(result.hardcover).toBe('created')
    expect(result.ibdb).toBe('created')

    // Verify records were created in database
    const googleBook = await prisma.googleBook.findUnique({
      where: { editionId: testEditionId },
    })
    expect(googleBook).toBeDefined()
    expect(googleBook?.title).toBe('Test Book')

    const hardcoverBook = await prisma.hardcoverBook.findUnique({
      where: { editionId: testEditionId },
    })
    expect(hardcoverBook).toBeDefined()
    expect(hardcoverBook?.title).toBe('Test Book')

    const ibdbBook = await prisma.ibdbBook.findUnique({
      where: { editionId: testEditionId },
    })
    expect(ibdbBook).toBeDefined()
    expect(ibdbBook?.title).toBe('Test Book')
  })

  test('should return updated status when updating existing records', async () => {
    // First create the records
    await prisma.googleBook.create({
      data: {
        googleId: 'google-existing-123',
        editionId: testEditionId,
        title: 'Old Title',
        authors: ['Old Author'],
      },
    })
    await prisma.hardcoverBook.create({
      data: {
        hardcoverId: 'hardcover-existing-123',
        editionId: testEditionId,
        title: 'Old Title',
        authors: ['Old Author'],
      },
    })
    await prisma.ibdbBook.create({
      data: {
        ibdbId: 'ibdb-existing-123',
        editionId: testEditionId,
        title: 'Old Title',
        authors: ['Old Author'],
      },
    })

    // Now update them
    const sources: SourceEntry[] = [
      {
        provider: 'google',
        data: {
          id: 'google-new-123',
          googleId: 'google-new-123',
          title: 'New Title',
          authors: ['New Author'],
          source: 'google',
          sourceWeight: 5,
          categories: [],
        },
      },
      {
        provider: 'hardcover',
        data: {
          id: 'hardcover-new-123',
          googleId: '',
          title: 'New Title',
          authors: ['New Author'],
          source: 'hardcover',
          sourceWeight: 6,
          categories: [],
        },
      },
      {
        provider: 'ibdb',
        data: {
          id: 'ibdb-new-123',
          googleId: '',
          title: 'New Title',
          authors: ['New Author'],
          source: 'ibdb',
          sourceWeight: 4,
          categories: [],
        },
      },
    ]

    const result = await upsertAllProviderRecords(testEditionId, sources)

    expect(result.google).toBe('updated')
    expect(result.hardcover).toBe('updated')
    expect(result.ibdb).toBe('updated')

    // Verify records were updated in database
    const googleBook = await prisma.googleBook.findUnique({
      where: { editionId: testEditionId },
    })
    expect(googleBook?.title).toBe('New Title')
    expect(googleBook?.authors).toEqual(['New Author'])

    const hardcoverBook = await prisma.hardcoverBook.findUnique({
      where: { editionId: testEditionId },
    })
    expect(hardcoverBook?.title).toBe('New Title')

    const ibdbBook = await prisma.ibdbBook.findUnique({
      where: { editionId: testEditionId },
    })
    expect(ibdbBook?.title).toBe('New Title')
  })

  test('should return null for providers not in sources array', async () => {
    // Only provide Google source, not Hardcover or IBDB
    const sources: SourceEntry[] = [
      {
        provider: 'google',
        data: {
          id: 'google-only-123',
          googleId: 'google-only-123',
          title: 'Test Book',
          authors: ['Test Author'],
          source: 'google',
          sourceWeight: 5,
          categories: [],
        },
      },
    ]

    const result = await upsertAllProviderRecords(testEditionId, sources)

    expect(result.google).toBe('created')
    expect(result.hardcover).toBeNull()
    expect(result.ibdb).toBeNull()

    // Verify only Google record was created
    const googleBook = await prisma.googleBook.findUnique({
      where: { editionId: testEditionId },
    })
    expect(googleBook).toBeDefined()

    const hardcoverBook = await prisma.hardcoverBook.findUnique({
      where: { editionId: testEditionId },
    })
    expect(hardcoverBook).toBeNull()

    const ibdbBook = await prisma.ibdbBook.findUnique({
      where: { editionId: testEditionId },
    })
    expect(ibdbBook).toBeNull()
  })

  test('should skip local provider and not create any record for it', async () => {
    const sources: SourceEntry[] = [
      {
        provider: 'local',
        data: {
          id: 'local-123',
          googleId: '',
          title: 'Local Book',
          authors: ['Local Author'],
          source: 'local',
          sourceWeight: 10,
          categories: [],
        },
      },
    ]

    const result = await upsertAllProviderRecords(testEditionId, sources)

    expect(result.google).toBeNull()
    expect(result.hardcover).toBeNull()
    expect(result.ibdb).toBeNull()
  })
})
