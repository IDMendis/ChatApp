package com.example.chat.controller;

import com.example.chat.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService storageService;

    public FileController(FileStorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> upload(@RequestPart("file") MultipartFile file) throws IOException {
        String filename = storageService.store(file);

        String base = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
        String fileUrl = base + "/files/" + filename;
        String apiUrl = base + "/api/files/" + filename + "?inline=true";

        Map<String, String> result = new HashMap<>();
        result.put("filename", filename);
        result.put("url", fileUrl);
        result.put("apiUrl", apiUrl);
        return result;
    }

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> download(@PathVariable String filename,
                                             @RequestParam(defaultValue = "true") boolean inline) {
        Resource resource = storageService.loadAsResource(filename);

        MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        ContentDisposition cd = (inline ? ContentDisposition.inline() : ContentDisposition.attachment())
                .filename(resource.getFilename(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .body(resource);
    }
}
