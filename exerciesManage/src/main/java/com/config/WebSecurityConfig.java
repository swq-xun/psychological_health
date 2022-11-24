package com.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Configuration
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
    @Bean
    public UserDetailsService getUserService() {
        return new UserService();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(getUserService()).passwordEncoder(passwordEncoder());
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
                .antMatchers( "/pages/login.html","/img/*","/plugins/**","/css/*","/js/*","/pages/regist.html","/user/Save").permitAll()// 无需认证
                .anyRequest().authenticated()   // 所有请求都需要验证
                .and()
                .headers().frameOptions().disable()
                .and()
                .formLogin()    // 使用默认的登录页面
                .loginPage("/pages/login.html")// 指定指定要的登录页面
                .loginProcessingUrl("/login")// 处理认证路径的请求
                //认证成功后的跳转页面 默认是get方式提交 自定义成功页面post方式提交
                //在 controller中处理时要注意
//                .defaultSuccessUrl("/pages/main.html")
//                .failureForwardUrl("/pages/error.html")
                .successHandler(new SimpleUrlAuthenticationSuccessHandler() {
            @Override
            public void onAuthenticationSuccess(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, Authentication authentication) throws IOException, ServletException {
                httpServletResponse.setContentType("application/json;charset=utf-8");
                ServletOutputStream out = httpServletResponse.getOutputStream();
                ObjectMapper objectMapper = new ObjectMapper();
                objectMapper.writeValue(out, "登录成功");
                out.flush();
                out.close();
            }
        }).failureHandler(new SimpleUrlAuthenticationFailureHandler() {
            @Override
            public void onAuthenticationFailure(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, AuthenticationException e) throws IOException, ServletException {
                httpServletResponse.setContentType("application/json;charset=utf-8");
                ServletOutputStream out = httpServletResponse.getOutputStream();
                ObjectMapper objectMapper = new ObjectMapper();
                objectMapper.writeValue(out, "登录失败");
                out.flush();
                out.close();
            }
        })
                .and()
                //开启cookie保存用户数据
//                .rememberMe()
                //设置cookie有效期
//                .tokenValiditySeconds(60 * 60 * 24 * 7) //有效期一周
                //设置cookie的私钥
//                .key("")
//                .and()
                .logout()
                .logoutUrl("/logout")
                .logoutSuccessUrl("/pages/login.html")
//                .invalidateHttpSession(true)
                .and()
//                .headers().frameOptions().disable().and()
                .csrf().disable() //关闭跨域保护
                .sessionManagement()
                .maximumSessions(1);// 同一用户 只允许一个在线 自动踢出在线用户

    }

}
