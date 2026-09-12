---
postId: 25
title: "현대 웹 애플리케이션"
description: ""
date: 2026-09-12
tags: []
draft: false
---

# 1. 기존의 JSP를 통한 웹 개발

지난 학기때, JSP를 통해 웹 개발을 하였습니다. 처음 배울 당시에 정적인 웹 화면에서 자바 코드를 통한 동적인 웹을 구성할 수 있어서 좋은 기술이라고 생각했지만, 사실 많은 문제점이 있었습니다. 이번 발표를 통해서 그 문제점들이 무엇이고 해결하기 위한 방법에 대해 알아보려고 합니다.

# 2. JSP 와 HTML 의 혼합

```jsp title="useBean.jsp"
<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Action Tag</title>
</head>
<body>
	<jsp:useBean id="person"
	class="ch04.com.dao.Person" scope="request" />
	<p> 아이디: <%=person.getId() %>
	<p> 이름: <%=person.getName() %>
</body>
</html>
```

JSP는 Java를 통해 웹 개발을 하기 위해서 HTML 안에 Java 코드를 넣는 구조를 가졌습니다. 이로 인해서 HTML 안에 자바의 동적인 로직을 넣기 위해서 특수한 문법을 사용해야하 하고, HTML 과 Java 코드가 혼합됩니다.  이로 인해서 자바의 객체지향적인 강점은 사라지고, 단지 동적인 웹 개발을 위해 HTML 안에 억지로 Java 언어를 사용한 것과 다름없다고 느꼈습니다.

# 3. 데이터베이스와의 의존성

```java title="connection.java"
<%@ page contentType ="text/html; charset=utf-8" %>
<%@ page import = "java.sql.*" %>
<html>
<head>
<title>Database SQL</title>
</head>
<body>
	<%
		Connection conn = null;
		try {
			String url = "jdbc:mysql://localhost:3306/JSPBookDB";
			String user="root";
			String password="1234";
			
			Class.forName("com.mysql.jdbc.Driver");
			conn = DriverManager.getConnection(url,user,password);
			out.println("데이터베이스 연결이 성공했습니다.");
		} catch (SQLException ex) {
			out.println("데이터베이스 연결이 실패했습니다.<br>");
			out.println("SQLException: " + ex.getMessage());
		} finally {
			if (conn!=null) {
				conn.close();
			}
		}
		
	%>
</body>
</html>
```
JSP를 통해 데이터베이스에 연결하고, 데이터를 주고받기 위해서는 복잡한 설정 코드가 필요하고 의존관계가 발생합니다. 데이터 베이스에 연결이 성공했다 하더라도, 다른 데이터베이스 방언이 변경되면 기존의 자바 코드를 수정해야하는 문제가 발생합니다.

# 4. 현대 웹 애플리케이션을 위한 개발

AI를 다양하게 써보면서 많은 경험이 있었습니다. 어떤 서비스나 앱을 만들기 위해 AI에게 '이걸 만들어줘' 라고 얘기해도 한번에 만들지 못하거나, 퀄리티가 떨어진다거나, 여러가지 에러가 발생했습니다. 
<br>

AI를 잘 다루기 위해선 개발에 어떤 기술이 필요하고, 어떤 규칙이 있는지 고려해야한다고 생각합니다.
따라서 이번에는 현대 웹 애플리케이션 개발을 위한 자바기반의 프레임워크인 스프링에 대해 알아보겠습니다.

# 5. Spring Framework
![](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRumN1_2nVkcLYsMf5J_emiMgJcwe21eM0bwNmXPFM-wp0GKaG9VDoYKV4&s=10)
<br>스프링은 자바 애플리케이션 개발에 사용되는 프레임워크 입니다. 자바의 객체지향의 강점을 그대로 살리면서 사용하기 단순하고 다른 기술과의 연동에 유연하다는 장점이 있습니다. 스프링 생태계는 매우 거대하기 때문에 스프링이 정확히 어떤 것이고 무엇을 제공하는지 보다 스프링이 관심을 갖는 대상인 오브젝트의 설계와 구현, 동작원리에 대해 집중하면 자연스럽게 스프링이 어떤 기술인지 이해할 수 있습니다. 따라서 간단한 예제를 통해 스프링이 어떤 설계를 추구하는지 살펴보겠습니다.

# 6. DAO
DAO(Data Access Object)는 데이터베이스를 사용해 데이터를 조회하거나 조작하는 기능을 담당하는 오브젝트를 뜻합니다.

```java title="User.java"
public class User {
  String id;
  String name;
  String password;

  public String getId() {
    return id;
  }
  
  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }
  
  public void setName(String name) {
    this.name = name;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }
}
```
사용자 정보를 저장할 User 클래스와, 데이터베이스에 값을 전달해주기 위해 Getter와 Setter 메서드를 구현한 코드입니다.

| 필드명 | 타입 | 설정 |
| --- | --- | --- |
| `id` | VARCHAR(10) | Primary Key |
| `name` | VARCHAR(20) | NOT NULL |
| `password` | VARCHAR(10) | NOT NULL |

```sql
CREATE TABLE users (
  id       VARCHAR(10) PRIMARY KEY,
  name     VARCHAR(20) NOT NULL,
  password VARCHAR(10) NOT NULL
);
```
Mysql 을 사용한다면 DB 생성후에 위와 같은 CREATE TABLE 명령어를 사용해 테이블을 만들 수 있습니다.

# 7. UserDao

사용자 정보를 DB에 넣고 관리할 수 있는 DAO 클래스를 만들어 보겠습니다.

```java title="UserDao.java"
public class UserDao {

    public void add(User user) throws ClassNotFoundException, SQLException {
        Class.forName("com.mysql.jdbc.Driver");
        Connection c = DriverManager.getConnection(
                "jdbc:mysql://localhost/springbook", "spring", "book");

        PreparedStatement ps = c.prepareStatement(
            "insert into users(id, name, password) values(?,?,?)");
        ps.setString(1, user.getId());
        ps.setString(2, user.getName());
        ps.setString(3, user.getPassword());

        ps.executeUpdate();

        ps.close();
        c.close();
    }

    public User get(String id) throws ClassNotFoundException, SQLException {
        Class.forName("com.mysql.jdbc.Driver");
        Connection c = DriverManager.getConnection(
                "jdbc:mysql://localhost/springbook", "spring", "book");

        PreparedStatement ps = c.prepareStatement(
                "select * from users where id = ?");
        ps.setString(1, id);

        ResultSet rs = ps.executeQuery();
        rs.next();
        User user = new User();
        user.setId(rs.getString("id"));
        user.setName(rs.getString("name"));
        user.setPassword(rs.getString("password"));

        rs.close();
        ps.close();
        c.close();

        return user;
    }
}
```
기존의 자바를 통해 데이터베이스에 사용자 정보를 넣고 관리하는 코드는 위와 같이 매우 복잡하고 어렵습니다. 데이터베이스에 연결하기 위한 코드, SQL 쿼리를 직접 작성하는 코드, 값을 저장하는 코드, 커넥션을 close 하는 코드 등, add, get 이라는 두가지 메소드 전체가 아주 많은 역할과 책임이 발생합니다. 이로 인해서 User 클래스가 변경되거나, 테이블 정의가 변경되거나, 사용하는 데이터베이스가 바뀌면 어떤 코드를 어떻게 고쳐야할지 유지보수도 어려워집니다.

# 8. 관심사의 분리

현대의 웹 애플리케이션은 아주 빠르게 변하고 있습니다. 요구사항이 빠르게 변하고, 비지니스 로직도 언제든지 바뀔 수 있습니다. 그래서 객체를 설계할 때 가장 염두해야할 사항은 바로 미래의 변화에 어떻게 대비할 것인가에 대해서입니다.  
따라서 이전에 만든 코드가 어떤 관심사항을 가지고 있고 그걸 리팩토링 해봄으로써 조금 더 유연하게 만들어보겠습니다.

# 9. UserDao의 관심사항
먼저 문제를 해결하기 위해, UserDao가 어떤 관심사항을 가지고 있는지 보겠습니다.
첫째는 DB와 연결을 위한 커넥션을 어떻게 가져올까라는 관심입니다. 세분화한다면 어떤 DB를 쓰고, 어떤 드라이버를 쓰고, 어떤 로그인 정보를 쓸것인지 등이 있습니다. 

둘째는 사용자 등록을 위해 데이터베이스에 보낼 SQL 문장을 담을 객체를 만들고 실행하는 것입니다. 

셋째는 작업이 끝나면 사용한 리소스 커넥션을 닫는 일입니다.

# 10. 중복 코드의 메서드 추출
가장 먼저 할 일은 커넥션을 가져오는 중복된 코드를 분리하는 것입니다. 중복된 데이터베이스 연결 코드를 getConnection() 이라는 이름의 독립적인 메서드로 만들어 줌으로써 이제는 데이티베이스 연결 설정이 변하더라도, 그걸 담당하는 하나의 메서드만 고치면 문제를 해결할 수 있습니다.

```java title="UserDao.java"
public class UserDao {

    public void add(User user) throws ClassNotFoundException, SQLException {
        Connection c = getConnection();
        ...
    }

    public User get(String id) throws ClassNotFoundException, SQLException {
        Connection c = getConnection();
        ...
    }

    private Connection getConnection() throws ClassNotFoundException, SQLException {
        Class.forName("com.mysql.jdbc.Driver");
        Connection c = DriverManager.getConnection(
            "jdbc:mysql://localhost/springbook", "spring", "book");
        return c;
    }
}
```
# 11. 변화에 대응하는 코드
앞서, 현대의 웹 애플리케이션은 급격하게 변화한다고 이야기 했습니다. 만약 여러 개발자가 위 코드를 사용하고, 개발자마다 사용하길 원하는 데이터베이스가 있다면 getConnection 은 메번 그 사용자에게 맞는 코드를 만들어서 줘야합니다. 

한 두명이면 가능하겠지만, 데이터베이스가 수십개 존재하고, 그걸 사용하는 방법도 매우 다양한 상황에서는 사실상 불가능한 상황이라고 생각합니다. 

이를 해결하기 위해서는 '어떻게 데이터베이스에 연결할 것인가' 를 UserDao 클래스에서 구현하는게 아니라, UserDao를 사용하는 사람에게 책임을 넘기면 문제를 해결할 수 있습니다.

# 12. 상속을 통한 확장

```java title="UserDao.java"
public abstract class UserDao {

    public void add(User user) throws ClassNotFoundException, SQLException {
        Connection c = getConnection();
        ...
    }

    public User get(String id) throws ClassNotFoundException, SQLException {
        Connection c = getConnection();
        ...
    }

    public abstract Connection getConnection()
            throws ClassNotFoundException, SQLException;
}
```

위처럼 추상클래스를 통해서 객체 생성을 막고, getConnection() 메서드를 추상메서드로 만듬으로써 상속을 통해서 사용자에게 맞는 데이터베이스 연결 구현 코드를 작성하도록 합니다.

```java title="NUserDao.java"
public class NUserDao extends UserDao {
    public Connection getConnection() throws ClassNotFoundException, SQLException {
        // N사 DB connection 생성코드
    }
}
```

```java title="DUserDao.java"
public class DUserDao extends UserDao {
    public Connection getConnection() throws ClassNotFoundException, SQLException {
        // D사 DB connection 생성코드
    }
}
```

따라서, extends 로 확장을 통해서 getConnection() 을 구현하는 책임을 UserDAO 클래스가 아니라, UserDAO 클래스를 사용하는 사용자에게 책임을 넘김으로써, UserDao는 더이상 '어떻게 데이터베이스에 연결할 것인가' 에 대한 역할을 신경써도 되지 않습니다. 이로 인해 UserDao는 '데이터베이스 연결 로직 변화'에 대응할 수 있습니다.

# 13. 상속의 문제점
이전의 상속을 통한 방법으로 N사와 D사가 직접 DB 연결 코드를 작성하도록 만들었습니다. 하지만 상속은 생각보다 문제가 많습니다.

자바는 다중 상속을 허용하지 않기 때문에, UserDao가 다른 목적으로 이미 상속을 쓰고 있다면 이 방법은 쓸 수 없습니다. 또한 자식클래스는 부모클래스에 종속되기 때문에, UserDao가 변경되면 이를 상속한 모든 클래스를 함께 변경될 수 있습니다.

가장 큰 문제는 확장이 UserDao 안에 갇힌다는 점입니다. 앞으로 AccountDao, MessageDao 같은 DAO가 생긴다면, 이들도 각자 상속 구조를 만들어야 하고 DB 연결 코드는 그때마다 다시 작성됩니다. 중복을 없애려고 시작했는데 중복이 되돌아오는 셈입니다.

# 14. 인터페이스 도입

상속의 문제점을 해결하기 위한 가장 간단한 방법은 DB 커넥션과 관련된 부분을 아에 별도의 인터페이스를 만들어 사용하는 것입니다. 

```java title="ConnectionMaker.java"
public interface ConnectionMaker {
    public Connection makeConnection() throws ClassNotFoundException, SQLException;
}
```

인터페이스는 필요한 반환값, 메서드 이름, 파라미터 값을 정하지만 어떻게 구현할지는 정의하지 않습니다. 즉, 데이터베이스에 연결한다 라는 역할에 대한 기준만 세우고, 어떻게 구현할지는 인터페이스를 사용하는 사용자에게 맡깁니다.

```java title="DConnectionMaker.java"
public class DConnectionMaker implements ConnectionMaker {

    public Connection makeConnection() throws ClassNotFoundException, SQLException {
        // D사의 독자적인 방법으로 Connection을 생성하는 코드
    }
}
```

이렇게 인터페이스를 implements 키워드를 사용하여 구현할 수 있습니다.

```java title="UserDao.java"
public class UserDao {
    private ConnectionMaker connectionMaker;

    public UserDao() {
        connectionMaker = new DConnectionMaker();
    }

    public void add(User user) throws ClassNotFoundException, SQLException {
        Connection c = connectionMaker.makeConnection();
        ...
    }

    public User get(String id) throws ClassNotFoundException, SQLException {
        Connection c = connectionMaker.makeConnection();
        ...
    }
}
```

기존의 UserDao 도 인터페이스를 가져다 사용하기만 하면 되고, 인터페이스를 구현한 객체가 어떻게 구현했는지 알 필요도 전혀 알 필요가없습니다.
동시에 상속에서 드러나는 문제도 대부분 해결됩니다. 다중 상속의 문제, 자식 클래스가 부모 클래스에 의존하게 되는 문제들은 이제 발생하지 않습니다.
<br> 하지만, 아직 하나의 문제가 남았습니다.
바로 UserDao의 생성자에서 어떤 구현 클래스를 사용할 것인가를 정해야 한다는 것입니다.
<br> UserDao는 데이터베이스 연결을 어떻게 할것인지는 이제 신경쓰지 않아도 되지만, 어떤 구현 클래스를 써야할지 직접 정해야 합니다. 이로 인해서 구현 클래스를 변경해야하면 UserDao의 생성자를 매번 고쳐야 합니다. UserDao를 수정하지 않고 DB 연결 방식만 바꾸겠다는 처음의 목표가 다시 무너지는 셈입니다.
<br> 원인은 UserDao가 여전히 DConnectionMaker라는 구체적인 클래스의 이름을 알고 있다는 데 있습니다.

하지만 이 결정은 UserDao가 할 일이 아닙니다. UserDao는 주어진 ConnectionMaker를 가져다 쓰기만 하면 되고, 어떤 것을 쓸지는 UserDao를 사용하는 쪽이 결정해야합니다.

# 15. 제어의 역전(Ioc)

Ioc란 Inversion of Control 약어로 프로그램의 제어 흐름 구조가 뒤바뀌는 것입니다. 이는 스프링에서 아주 핵심적인 개념입니다. 처음 스프링을 소개할때 스프링이 어떤 개념을 가지고 무엇을 제공하는지 아는것보다 설계와 동작원리를 이해하면 스프링에  대해 알기 쉽다고 했는데, 이전의 DAO의 리팩토링 과정을 보면 제어의 역전이라는 개념이 왜 필요했고 어떻게 만들어졌는지 쉽게 이해할 수 있을겁니다.
<br>일반적인 프로그램은 main() 메소드와 같이 프로그램이 시작되는 지점에서 다음에 사용할 라이브러리 기능을 결정하고, 그걸 직접 생성하여 메소드를 호출하는 식의 흐름이었습니다.
<br> 이 과정에서 각 코드는 프로그램 흐름을 결정하거나 사용할 오브젝트를 구성하는 작업에 능동적으로 참여하게 됩니다.
<br> 초기의 UserDao를 보면 자신이 사용할 데이터베이스 로직을 구현하고 언제, 어떻게 사용할지 스스로 관리합니다.
<br>제어의 역전이란 이런 제어의 흐름을 거꾸로 뒤집는 것을 뜻합니다. 오브젝트가 자신이 사용할 다른 오브젝트를 스스로 선택하지 않고, 직접 생성하지도 않으며, 어떻게 만들어지고 어디에 사용되는지 알 수 없습니다.
<br> 여기서 프레임워크와 라이브러리의 차이가 드러납니다. 프레임워크도 제어의 역전 개념이 적용된 기술인데, 라이버리리에 있는 함수를 직접 호출해서 제어하는게 아니라 프레임워크 위에 개발한 클래스를 등록해두고, 프레임워크가 애플리케이션 흐름을 제어합니다.

# 16. DaoFactory

이제 본격적으로 스프링의 기능을 사용하기 위해 DaoFactory 라는 클래스를 만들어 보겠습니다.

```java title="DaoFactory.java"
@Configuration
public class DaoFactory {

    @Bean
    public UserDao userDao() {
        return new UserDao(connectionMaker());
    }

    @Bean
    public ConnectionMaker connectionMaker() {
        return new DConnectionMaker();
    }
}
```
@Configuration 을 통해 스프링에게 설정 정보를 담당하는 에노테이션을 사용하고 @Bean 을 통해서 이전에 UserDao 가 책임을 맡은 어떤 구현 클래스를 사용할 것인가? 를 이제 UserDao 가 아닌 DaoFactory 라는 설정정보를 담당하는 클래스에서 책임을 분리했습니다. 이 에노테이션은 스프링의 기능중 하나입니다.

# 17. UserDao 개선

```java title="UserDao.java"
public class UserDao {
    private ConnectionMaker connectionMaker;

    public UserDao(ConnectionMaker connectionMaker) {
        this.connectionMaker = connectionMaker;
    }

    public void add(User user) throws ClassNotFoundException, SQLException {
        Connection c = connectionMaker.makeConnection();
        ...
    }

    public User get(String id) throws ClassNotFoundException, SQLException {
        Connection c = connectionMaker.makeConnection();
        ...
    }
}
```
이제 UserDao 클래스는 생성자에서 데이터베이스 연결을 구현하는 객체를 파라미터로 받아옴으로써 역할과 책임을 분리하게 되었습니다. 이제 UserDao는 어떻게 데이터베이스 연결을 할것인가를 결정하는게 아니라, 이미 연결된 데이터베이스를 통해서 add 와 get 메서드에서 데이터를 어떤식으로 추가하고 가져올것인지 하나의 기능에만 집중할 수 있게 되었습니다.

# 18. UserDao 사용

```java
ApplicationContext context = new AnnotationConfigApplicationContext(DaoFactory.class);
UserDao dao = context.getBean("userDao", UserDao.class);
```
이전에 DaoFactory 를 통해서 UserDao 를 스프링에 등록했는데, 사용하기 위해서는 위와같은 코드로 UserDao를 사용할 수 있습니다. 에노테이션으로 설정했기 때문에 에노테이션 설정을 담당하는 구현체를 사용했습니다.

```java
UserDao dao = new DaoFactory().userDao();
```
따라서 사용하는쪽은 이제 위와같은 코드 한줄로 가능합니다.
