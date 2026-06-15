# GlassBoard: Verifiable Dependency Tracker & Handoff Protocol

GlassBoard is a collaborative dependency tracker and cross-department workflow manager. It resolves organizational visibility bottlenecks by tracking active progress, mapping dependency paths, and enforcing a digital, verifiable "handshake" protocol (complete with visual proofs and timestamps) for inter-team handovers. It features Role-Based Access Control (RBAC) to ensure tiered privacy between department members and organization leadership.

---

## 🚀 Key Features

### Internal Task Checklists

Lightweight task managers embedded within each department's module. Progression metrics are dynamically calculated and broadcast to the global tracker as tasks are completed.

### Module Progress Tracking

Visual progress bars and status indicators (`On Track`, `Delayed`, `Blocked`) that reflect the health of each department.

### Digital Handshake System

A strict handoff protocol (e.g., Module A ➔ Module B) requiring transition details, visual proof of delivery (document/photo upload), and explicit acceptance or rejection from the receiving team.

### Collaborative Document Workspace

An inter-module shared file repository with automatic version control. Modifying an existing asset updates its version number while retaining prior revisions in an interactive audit log.

### Tiered Privacy & Management View

Role-Based Access Control (RBAC). Department members access tasks and handshakes relevant to them, while Organization Heads unlock an unrestricted **Pipeline Dependency Map** and a **Bottleneck Diagnostics Ledger**.

### Real-time Audit Ledger

Synchronized pub/sub logging of every organizational transaction (checklist toggles, file uploads, handshake requests, approvals, and rejections).

---

## 🛠️ Tech Stack & Architecture

### Frontend

* React Native
* Expo Router
* TypeScript
* Vanilla CSS
* Premium Dark Mode Glassmorphic UI

### Backend

* Firebase Authentication
* Firebase Firestore
* Firebase Storage
* Firebase Realtime Database

### Data Resiliency (Offline Fallback)

A persistent LocalStorage-backed database automatically runs the application out-of-the-box if Firebase API credentials are not configured.

---

## 📦 Installation & Setup

### Prerequisites

* Node.js (v18.0 or higher recommended)
* npm (v9.0 or higher)

### Steps

1. Navigate to the project directory:

```bash
cd Glassboard
```

2. Install dependencies:

```bash
npm install
```

3. Launch the development server:

```bash
npm run web
```

This compiles the web bundle and launches the application in your browser at:

```text
http://localhost:8081
```

> **Note:** To run the application on a physical mobile device:

```bash
npm run start
```

Then scan the generated QR code using the Expo Go application available on Android and iOS.

---

## 🎥 Walkthrough / Evaluation Guide

GlassBoard comes pre-seeded with Quick Access Profiles on the Login screen to make evaluation of the multi-department workflow seamless.

### Step 1: Log in as Developer A (Alice Smith - Frontend Core)

1. Go to the Login page.
2. Select **Alice Smith (Frontend Core)**.
3. Navigate to the **Dashboard** tab.
4. Toggle an existing checklist item or create a new task such as:

   * Prepare final code review
5. Observe the progress bar update in real time.
6. Complete all checklist items until progress reaches **100%**.
7. Verify that the handoff state becomes available.

---

### Step 2: Upload Shared Specifications (Version Control Workspace)

1. Open the **Files Workspace** tab.
2. Locate `frontend_api_specification.json (v1)` in the repository.
3. Click **View History** to inspect its audit trail.
4. In the quick-select panel choose:

   * `petstore_spec.json`
5. Add a revision comment.
6. Click **Share / Publish Asset Version**.
7. Open **View History** again and verify that a new **v2 revision** appears in the audit log.

---

### Step 3: Request Handoff (Digital Handshake)

1. Navigate to:

   * Handshakes → Initiate Handover
2. Observe that the destination department is automatically set to:

   * API Gateway & Auth
3. Enter transition comments.
4. Click **Simulate Proof Capture**.
5. Verify that a visual proof attachment is generated.
6. Click **Submit Handshake Request**.
7. Open **Transition Archive**.
8. Confirm the request status is:

```text
PENDING
```

9. Log out.

---

### Step 4: Log in as Developer B (Bob Johnson - API Gateway & Auth)

1. Log in as **Bob Johnson (API Gateway & Auth)**.
2. Open the **Handshakes** tab.
3. Navigate to the **Incoming Queue**.
4. Locate the handoff request submitted by Frontend Core.
5. Review:

   * Transition comments
   * Attached proof artifact
6. Click **Accept Transition**.
7. Return to the **Dashboard**.
8. Verify:

   * Department becomes unlocked
   * Status changes to **On Track**

> Rejections require a comment and automatically flag the sender as delayed.

---

### Step 5: Log in as Organization Head (Dr. Jane Miller)

1. Log in as **Dr. Jane Miller**.
2. Open the **Management View** tab.
3. Review the **Pipeline Dependency Map** visualizing:

```text
Frontend Core → API Gateway & Auth → Analytics & Reporting
```

4. Inspect the **Bottleneck Analysis Ledger**.
5. Review active dependency blockers and delayed modules.
6. Open the **Real-time Global Audit Ledger**.
7. Observe the chronological history of:

   * Task updates
   * Checklist changes
   * File version publications
   * Handoff requests
   * Approvals
   * Rejections

---

## 🔒 Access Control Model

| Role              | Permissions                                                  |
| ----------------- | ------------------------------------------------------------ |
| Department Member | View and manage local tasks, files, and handshakes           |
| Department Lead   | Manage department workflow and transitions                   |
| Organization Head | Full visibility across all departments and dependency chains |

---

## 📊 Core Workflow

```text
Task Completion
       ↓
Progress Calculation
       ↓
Dependency Unlock
       ↓
Digital Handshake
       ↓
Proof Verification
       ↓
Acceptance / Rejection
       ↓
Audit Logging
```

---

## 📜 Auditability

Every significant organizational action is permanently recorded with:

* Timestamp
* User identity
* Department information
* Event type
* Related assets
* Approval history

This creates a verifiable chain of custody for all cross-team interactions and project transitions.

---

## 🎯 Project Goal

GlassBoard is designed to eliminate organizational blind spots, improve accountability between dependent teams, and provide leadership with real-time visibility into project execution, handoff quality, and operational bottlenecks.
