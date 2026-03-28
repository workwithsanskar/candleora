package com.candleora.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CatalogProductsTimingFilter extends OncePerRequestFilter {

    private static final Logger LOGGER = LoggerFactory.getLogger(CatalogProductsTimingFilter.class);
    private static final String SERVER_TIMING_HEADER = "Server-Timing";
    private static final String RESPONSE_TIME_HEADER = "X-Response-Time";
    private static final String SERVER_TIMING_METRIC = "catalog-products";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI().substring(request.getContextPath().length());
        return !"/api/products".equals(path);
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        long startTime = System.nanoTime();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long elapsedMs = (System.nanoTime() - startTime) / 1_000_000L;
            String requestTarget = request.getQueryString() == null
                ? request.getRequestURI()
                : request.getRequestURI() + "?" + request.getQueryString();

            response.setHeader(SERVER_TIMING_HEADER, SERVER_TIMING_METRIC + ";dur=" + elapsedMs);
            response.setHeader(RESPONSE_TIME_HEADER, elapsedMs + "ms");

            LOGGER.info(
                "catalog_products path={} status={} durationMs={}",
                requestTarget,
                response.getStatus(),
                elapsedMs
            );
        }
    }
}
