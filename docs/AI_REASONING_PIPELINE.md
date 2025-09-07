# AI Reasoning Pipeline Design

**Document Status**: Draft  
**Version**: 0.1  
**Date**: 2025-07-10

## 1. Overview

This document outlines the design for the multi-step AI reasoning pipeline for the Get Your Grant 2.0 project. The pipeline will leverage the `o1-preview` and `o1-mini` models to generate high-quality, compliant Erasmus+ grant proposals.

The core of the pipeline is a three-step process:
1.  **Analysis**: Analyze the user's project and the relevant section of the grant application.
2.  **Generation**: Generate the content for the section based on the analysis.
3.  **Review**: Review the generated content for compliance, quality, and completeness.

This multi-step approach allows for a more robust and reliable generation process, reducing the likelihood of errors and improving the overall quality of the output.

## 2. Pipeline Architecture

The pipeline will be implemented as a series of orchestrated calls to the OpenAI API, using the `o1` models. The orchestration will be handled by a new `AIOrchestrator` service in the backend.

### 2.1. Analysis Step

The analysis step is responsible for understanding the context of the request and gathering the necessary information to generate the content.

**Inputs**:
*   User's project details (e.g., project title, summary, partners).
*   The specific section of the grant application to be generated (e.g., "Project Rationale", "Impact").
*   Selected Erasmus+ priorities.

**Process**:
1.  **Knowledge Retrieval**: The `AIOrchestrator` will query the knowledge base to retrieve relevant information from the Erasmus+ documentation. This will include:
    *   Evaluation criteria for the specific section.
    *   Funding rules and guidelines.
    *   Examples of successful proposals (if available).
2.  **Prompt Generation**: A specialized prompt will be generated for the `o1-mini` model. This prompt will instruct the model to act as an "analyst" and create a structured plan for the content generation.
3.  **Analysis Generation**: The `o1-mini` model will process the prompt and generate a structured analysis, which will include:
    *   Key points to be addressed in the section.
    *   A list of compliance requirements to be met.
    *   Suggestions for aligning the content with the selected priorities.

**Output**:
*   A structured JSON object containing the analysis and plan for the content generation.

### 2.2. Generation Step

The generation step is responsible for creating the actual content for the grant proposal section.

**Inputs**:
*   The analysis and plan from the previous step.
*   The user's project details.

**Process**:
1.  **Prompt Generation**: A new prompt will be generated for the `o1-preview` model. This prompt will include the analysis from the previous step and instruct the model to act as a "grant writer".
2.  **Content Generation**: The `o1-preview` model will process the prompt and generate the full text for the section.

**Output**:
*   The generated text for the grant proposal section.

### 2.3. Review Step

The review step is responsible for ensuring the quality and compliance of the generated content.

**Inputs**:
*   The generated content from the previous step.
*   The analysis and plan from the analysis step.

**Process**:
1.  **Prompt Generation**: A final prompt will be generated for the `o1-mini` model. This prompt will instruct the model to act as a "reviewer" and check the generated content against the compliance requirements and the initial plan.
2.  **Review Generation**: The `o1-mini` model will process the prompt and generate a review report, which will include:
    *   A compliance score.
    *   A list of any identified issues or areas for improvement.
    *   Suggestions for refining the content.

**Output**:
*   A review report in JSON format.
*   The final, reviewed content.

## 3. Data Flow

The following diagram illustrates the data flow through the pipeline:

```
[User Request] -> [AIOrchestrator]
                     |
                     v
        +---------------------+
        |   1. Analysis Step  |
        | (o1-mini)           |
        +---------------------+
                     |
                     v
        +---------------------+
        |  2. Generation Step |
        | (o1-preview)        |
        +---------------------+
                     |
                     v
        +---------------------+
        |   3. Review Step    |
        | (o1-mini)           |
        +---------------------+
                     |
                     v
[Generated Content] <- [AIOrchestrator]
```

## 4. Next Steps

*   Implement the `AIOrchestrator` service.
*   Develop the prompt templates for each step of the pipeline.
*   Integrate the pipeline with the backend API.
