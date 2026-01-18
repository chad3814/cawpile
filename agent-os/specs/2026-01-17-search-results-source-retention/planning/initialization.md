# Spec Initialization

## Feature Description

The search results from /api/books/search are coordinated through multiple sources and each source's book that is determined to be the same as another source, are merged in `mergeResults()`. Update the search results returned so that the individual source results are retained. Also, sign each search result entry (that includes multiple sources).
