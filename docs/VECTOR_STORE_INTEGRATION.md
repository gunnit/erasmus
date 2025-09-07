# Vector Store Integration with OpenAI

**Document Status**: Draft  
**Version**: 0.1  
**Date**: 2025-07-10

## 1. Overview

This document describes the integration between the `AIOrchestrator` and the `ErasmusKnowledgeBase` (our vector store). The goal of this integration is to provide the AI models with relevant context from the Erasmus+ documentation to generate high-quality grant proposals.

## 2. Integration Pattern

The integration is based on a service-oriented architecture, where the `AIOrchestrator` acts as a client to the `ErasmusKnowledgeBase`.

### 2.1. Data Flow

1.  The `AIOrchestrator` receives a request to generate a section of a grant proposal.
2.  The `AIOrchestrator` calls the `ErasmusKnowledgeBase.get_context_for_section` method, passing the project details and the section name.
3.  The `ErasmusKnowledgeBase` performs a semantic search on the vector store and returns a `KnowledgeContext` object.
4.  The `AIOrchestrator` uses the `KnowledgeContext` to build a prompt for the `o1-mini` model to perform the analysis step.

### 2.2. Data Contracts

The following data structures are used to exchange information between the services:

**`KnowledgeContext`**:
*   `query`: The search query used to retrieve the context.
*   `relevant_content`: A list of `SearchResult` objects.
*   `entity_types`: A list of the entity types of the search results.
*   `total_results`: The total number of search results.
*   `search_time`: The time taken to perform the search.
*   `timestamp`: The timestamp of the search.

**`SearchResult`**:
*   `content`: The text content of the search result.
*   `similarity`: The cosine similarity between the query and the result.
*   `entity_type`: The type of the entity (e.g., "priority", "funding_rule").
*   `entity_id`: The unique ID of the entity.
*   `source_file`: The source file of the content.
*   `keywords`: A list of keywords associated with the content.
*   `semantic_tags`: A list of semantic tags.
*   `section`: The section of the document where the content was found.
*   `rank`: The rank of the search result.

## 3. Asynchronous Communication

The `ErasmusKnowledgeBase` is an asynchronous service, while the `AIOrchestrator` is currently synchronous. This mismatch is handled by calling the async methods of the knowledge base using `asyncio.run()`.

**Future Improvement**:
*   Refactor the `AIOrchestrator` to be fully asynchronous. This will improve performance and scalability, especially when handling multiple requests concurrently. This will be addressed in a future task.

## 4. Error Handling

The `AIOrchestrator` includes error handling to gracefully manage failures in the knowledge base service. If the `get_context_for_section` method fails, the pipeline is aborted, and an error is logged.

## 5. Conclusion

The current integration between the `AIOrchestrator` and the `ErasmusKnowledgeBase` is functional and provides the necessary context for the AI models. The data contracts are well-defined, and the integration pattern is clear. The main area for improvement is the asynchronous communication, which will be addressed in a future task.
