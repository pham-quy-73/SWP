Feature có business logic, integration 
với service khác 

# Feature: [Tên tính năng] 
Status: Draft | Review | Approved 
Author: [Tên] | Reviewer: [Tên] | Date: [YYYY-MM-DD] 
Priority: High | Medium | Low 
 
## 1. Business Context 
# [Giải thích tại sao feature này cần tồn tại — 2-3 câu] 
# [Liên kết với business goal nào của dự án] 
 
## 2. User Stories 
# Story 1 (Happy Path): 
#   As a [user type], I want to [action] so that [benefit]. 
# Story 2 (Edge Case): 
#   As a [user type], when [condition], I want to [action]. 
 
## 3. Acceptance Criteria (EARS) 
# WHEN user submits [form] with valid data 
#   THE SYSTEM SHALL [action] AND return [response]. 
# WHEN user submits [form] with invalid [field] 
#   THE SYSTEM SHALL return HTTP 400 with error code [CODE]. 
# WHILE user is [state], THE SYSTEM SHALL [restriction]. 
 
## 4. API Contract 
# Endpoint: POST /api/v1/[resource] 
# Request: { field1: string (required), field2: number (optional) } 
# Response 201: { success: true, data: { id, ...fields } } 
# Response 400: { success: false, error: { code, message } } 
# Response 401: unauthorized 
 
## 5. Technical Constraints 
# - Max response time: 500ms (p95) 
# - Rate limit: 100 requests/minute per user 
# - [Other constraints] 
 
## 6. Out of Scope 
# - [Feature X — will be in Sprint N+1] 
# - [Integration with Y — separate spec] 