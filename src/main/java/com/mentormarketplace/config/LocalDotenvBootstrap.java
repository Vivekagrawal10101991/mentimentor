package com.mentormarketplace.config;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvEntry;

/**
 * Loads {@code .env} from the repo root and {@code mentor-marketplace-web/.env} into system
 * properties before Spring starts (Spring does not read those files by default). OS environment
 * variables always win. If {@code GOOGLE_CLIENT_ID} is still unset but {@code VITE_GOOGLE_CLIENT_ID}
 * is present (typical Vite setup), copies it so the backend matches the SPA.
 */
public final class LocalDotenvBootstrap {

    private LocalDotenvBootstrap() {}

    public static void apply() {
        loadEnvFile(".", ".env");
        loadEnvFile("mentor-marketplace-web", ".env");
        syncGoogleClientIdFromVite();
    }

    private static void loadEnvFile(String directory, String filename) {
        Dotenv dotenv = Dotenv.configure()
                .directory(directory)
                .filename(filename)
                .ignoreIfMissing()
                .load();
        for (DotenvEntry entry : dotenv.entries()) {
            String key = entry.getKey();
            if (key == null || key.isBlank()) {
                continue;
            }
            if (System.getenv(key) != null) {
                continue;
            }
            System.setProperty(key, entry.getValue());
        }
    }

    private static void syncGoogleClientIdFromVite() {
        if (isSet(System.getenv("GOOGLE_CLIENT_ID")) || isSet(System.getProperty("GOOGLE_CLIENT_ID"))) {
            return;
        }
        String vite = firstNonBlank(System.getenv("VITE_GOOGLE_CLIENT_ID"), System.getProperty("VITE_GOOGLE_CLIENT_ID"));
        if (vite != null) {
            System.setProperty("GOOGLE_CLIENT_ID", vite.trim());
        }
    }

    private static boolean isSet(String value) {
        return value != null && !value.isBlank();
    }

    private static String firstNonBlank(String a, String b) {
        if (isSet(a)) {
            return a.trim();
        }
        if (isSet(b)) {
            return b.trim();
        }
        return null;
    }
}
