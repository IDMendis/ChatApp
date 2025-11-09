# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands (Maven/Spring Boot)

- Build (compile + package without tests):
  ```powershell path=null start=null
  mvn -q -DskipTests package
  ```
- Build and run unit tests (none exist yet, but command works):
  ```powershell path=null start=null
  mvn test
  ```
- Run a single test class or method:
  ```powershell path=null start=null
  mvn -Dtest=ClassNameTest test
  mvn -Dtest=ClassNameTest#methodName test
  ```
- Run the app (dev mode):
  ```powershell path=null start=null
  mvn spring-boot:run
  ```
- Run the packaged JAR (after packaging):
  ```powershell path=null start=null
  java -jar target/realtime-chat-0.0.1-SNAPSHOT.jar
  ```
- Clean build artifacts:
  ```powershell path=null start=null
  mvn clean
  ```

Notes:
- This repo does not include the Maven Wrapper (`mvnw`); use a local Maven installation.
- No code linters/formatters are configured in `pom.xml`.

## High-level architecture

Spring Boot 3 application that provides:
- Real-time group chat over WebSocket (STOMP over SockJS)
- Simple file upload/download API backed by local disk storage

Key components:
- WebSocket/STOMP configuration (`config/WebSocketConfig.java`)
  - STOMP endpoint: `/ws` (SockJS enabled, CORS permissive)
  - App destination prefix: `/app`
  - In-memory simple broker on `/topic`
- Chat messaging (`controller/ChatController.java`, `model/ChatMessage.java`)
  - Incoming app destinations:
    - `/app/chat.sendMessage` → echoes messages to subscribers
    - `/app/chat.addUser` → tags message as JOIN, broadcasts
  - Broadcast topic: `/topic/public`
- File serving (`controller/FileController.java`, `service/FileStorageService.java`)
  - POST `/api/files/upload` (multipart `file`) → stores to `uploads/`, returns `{ filename, url }`
  - GET `/api/files/{filename}` → streams file as attachment
  - Storage root: `uploads/` (created on service init, relative to working directory)

Runtime behavior:
- Default server port: 8080 (no explicit override in `application.properties`).
- Multipart limits set to 50MB.

## Developing and testing the realtime features

- STOMP client connection URL (SockJS): `http://localhost:8080/ws`
- Subscribe to: `/topic/public`
- Publish destinations:
  - Send chat message: `/app/chat.sendMessage` (payload maps to `ChatMessage`)
  - Add user (join notification): `/app/chat.addUser`

Minimal STOMP client flow:
```js path=null start=null
// Pseudocode
const socket = new SockJS('http://localhost:8080/ws');
const stomp = Stomp.over(socket);
stomp.connect({}, () => {
  stomp.subscribe('/topic/public', (frame) => console.log(frame.body));
  stomp.send('/app/chat.sendMessage', {}, JSON.stringify({ sender: 'alice', content: 'hi' }));
});
```

## Repository overview

- Build tool: Maven (`pom.xml`), Java 17
- Packages:
  - `com.example.chat.config` — WebSocket/STOMP setup
  - `com.example.chat.controller` — Chat and file HTTP/STOMP endpoints
  - `com.example.chat.model` — Chat message DTO
  - `com.example.chat.service` — Local file storage implementation
- Entrypoint: `com.example.chat.RealtimeChatApplication`

## Gotchas

- File storage path `uploads/` is relative to the process working directory; ensure the app has write permissions there when running/packaging.
- CORS for WebSocket is wide open via `setAllowedOriginPatterns("*")`; adjust for production as needed.
