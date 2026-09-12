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

# 2. JSP 와 HTML 의 의존성

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

JSP는 Java를 통해 웹 개발을 하기 위해서 HTML 안에 Java 코드를 넣는 구조를 가졌습니다. 이로 인해서 HTML 안에 자바의 동적인 로직을 넣기 위해서 특수한 문법을 사용해야하 하고, HTML 과 Java 코드를 분리하기 힘든 의존성이 발생하게 됩니다. 

# 3. Java의 객체지향설계의 손실

자바의 가장 큰 강점은 객체지향언어라고 생각합니다. 하지만 방금 본 코드는 HTML을 사용하기 위해 억지로 자바를 사용한 편에 가깝습니다. 객체지향은 실세계에 존재하는 객체들을 언어로 표현하는것과 더불어 실세계에 존재하지 않는것들도 전부 표현이 가능하기 때문에 다양한 설계가 가능하다는 이점이 있지만, JSP는 자바의 강점을 살리지 못합니다.

# 4. 데이터베이스와의 의존성

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

# 5. 현대 웹 애플리케이션을 위한 개발

AI를 다양하게 써보면서 많은 경험이 있었습니다. 어떤 서비스나 앱을 만들기 위해 AI에게 '이걸 만들어줘' 라고 얘기해도 한번에 만들지 못하거나, 퀄리티가 떨어진다거나, 여러가지 에러가 발생했습니다. 
<br>

AI를 잘 다루기 위해선 개발에 어떤 기술이 필요하고, 어떤 규칙이 있는지 고려해야한다고 생각합니다.
따라서 이번에는 현대 웹 애플리케이션 개발을 위한 자바기반의 프레임워크인 스프링에 대해 알아보겠습니다.

# 6. 



# 7. DAO
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

  public String geetPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
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
