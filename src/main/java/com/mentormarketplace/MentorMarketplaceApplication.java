package com.mentormarketplace;

import com.mentormarketplace.config.JwtProperties;
import com.mentormarketplace.config.LocalDotenvBootstrap;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan
@EnableConfigurationProperties(JwtProperties.class)
@EnableScheduling
public class MentorMarketplaceApplication {

    public static void main(String[] args) {
        LocalDotenvBootstrap.apply();
        SpringApplication.run(MentorMarketplaceApplication.class, args);
    }
}
