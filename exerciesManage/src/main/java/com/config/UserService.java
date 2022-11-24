package com.config;

import com.domain.user;
import com.service.userService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;
@Service
public class UserService implements UserDetailsService  {
    @Autowired
    public com.service.userService userService;
    @Autowired(required = false)
    private PasswordEncoder passwordEncoder;
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 根据用户查询用户信息
        //User user = userMapper.findByUsername(username); //查询数据库
//        user user = new user(1, username, "123456", 1);//注意：这里我就是用来测试的，实际应该从数据库中获取
        user user=userService.selectByUserName(username);
        if (user != null) {
            // 根据用户查询用户对应权限
            Collection<GrantedAuthority> authorities = new ArrayList<>();
			/* //查询登录用户所拥有的角色
                List<Role> list = RoleMapper.findByUserId(userId);
                for (Role role : list) {
                    GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_"+role.getRoleName());
                    authorities.add(authority);
                }
            */
            //创建一个授权对象
            GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_ADMIN"); //注意：这里我就是用来测试的，实际应该从数据库中获取
            authorities.add(authority);
            return new org.springframework.security.core.userdetails.User(
                    user.getUsername(),
                    // 因为数据库是明文，所以这里需加密密码
                    passwordEncoder.encode(user.getPassword()),
                    authorities);
        }
        return null;


    }
}
