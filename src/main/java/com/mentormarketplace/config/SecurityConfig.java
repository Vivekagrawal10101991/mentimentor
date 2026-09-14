package com.mentormarketplace.config;

import com.mentormarketplace.auth.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter)
            throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/admin/admins").hasRole("super_admin")
                        .requestMatchers(HttpMethod.POST, "/admin/admins").hasRole("super_admin")
                        .requestMatchers("/admin/**").hasAnyRole("admin", "super_admin")
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/users/profile").permitAll()
                        .requestMatchers("/booking/**", "/payment/**").permitAll()
                        .requestMatchers("/mentors/profile", "/mentors/availability", "/mentors/available").permitAll()
                        .requestMatchers("/mentors/search").permitAll()
                        .requestMatchers("/users/me/**", "/user/**", "/mentors/me/**", "/bookings/**", "/payments/**", "/requests/**")
                        .authenticated()
                        .requestMatchers("/mentors/**").permitAll()
                        .anyRequest()
                        .permitAll())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) -> {
                    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    res.setContentType("application/json");
                    res.getWriter().write(
                            "{\"error\":{\"code\":\"UNAUTHORIZED\",\"message\":\"Authentication required\"}}");
                }))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
