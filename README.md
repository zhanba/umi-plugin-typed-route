# umi-plugin-typed-route

在webapp中跳转路由时，还在使用下面的方式拼接路由吗？是否在路由过多时感到难以维护？
```ts
history.push(`/app/welcome`);
history.push(`/app/${projectId}`);
history.push(`/app/${projectId}/${userId}`);
```
`umi-plugin-typed-route`为你提供类型安全的路由跳转！

```ts
history.push(pathFactory.app.welcome());
history.push(pathFactory.app.project({projectId: 123}));
history.push(pathFactory.app.project.user({projectId: 123, userId: "tom"}));
```

## Install

```sh
npm i -D umi-plugin-typed-route
```

## Usage
1. config umi
```ts
export default {
    plugins: ["umi-plugin-typed-route"],
}
```

2. modify routes

add `name` proprety for every route.

为每个路由配置下列属性：
- `name`: required, 路由的英文名称，使用在代码中, 全英文
- `query`: optional, 查询字符串query string的key值数组,如`?sort=desc`则配置`["sort"]`
- `title`: optional, 当前路由和页面的名称，建议中文
- `description`: optional, 当前路由和页面的描述

例子🌰：
```ts
export default {
    routes: [
        {
            path: '/',
            name: 'app',
            title: '首页',
            description: '应用首页'
        }
    ]
}
```

3. use in your page

`npm start`启动项目

```ts
import { history， pathFactory } from 'umi';
// import { history， pathFactory } from '@alipay/bigfish';

history.push(pathFactory.app.welcome());

```
