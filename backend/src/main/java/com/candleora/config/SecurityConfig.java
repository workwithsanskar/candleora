package com.candleora.config;

import com.candleora.security.AppUserDetailsService;
import com.candleora.security.JwtAuthenticationFilter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AppUserDetailsService appUserDetailsService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.frontend-origin-patterns:}")
    private String frontendOriginPatterns;

    public SecurityConfig(
        JwtAuthenticationFilter jwtAuthenticationFilter,
        AppUserDetailsService appUserDetailsService
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.appUserDetailsService = appUserDetailsService;
    }

    @Bean
    @Order(1)
    public SecurityFilterChain publicAuthSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher(
                "/api/public/**",
                "/api/auth/signup",
                "/api/auth/register",
                "/api/auth/login",
                "/api/auth/google",
                "/api/auth/phone"
            )
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .anyRequest().permitAll());

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/**", "/api/categories").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/fixes", "/api/guides", "/api/faqs").permitAll()
                .anyRequest().authenticated())
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(appUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)
        throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(buildAllowedOrigins());
        configuration.setAllowedOriginPatterns(buildAllowedOriginPatterns());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private List<String> buildAllowedOrigins() {
        return Stream.of(frontendUrl, "https://candleora.vercel.app", "http://localhost:5173")
            .filter(origin -> origin != null && !origin.isBlank())
            .distinct()
            .toList();
    }

    private List<String> buildAllowedOriginPatterns() {
        List<String> patterns = new ArrayList<>();

        if (frontendOriginPatterns != null && !frontendOriginPatterns.isBlank()) {
            patterns.addAll(
                Stream.of(frontendOriginPatterns.split(","))
                    .map(String::trim)
                    .filter(pattern -> !pattern.isBlank())
                    .toList()
            );
        }

        if (!patterns.contains("https://*.vercel.app")) {
            patterns.add("https://*.vercel.app");
        }

        return patterns;
    }
}
