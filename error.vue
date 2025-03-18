
<template>
    <div>
      <h1>发生错误</h1>
      <p>抱歉，页面无法加载。</p>
      <p>错误代码：{{ error.statusCode }}</p>
    </div>
  </template>
   
  <script>
  export default {
    props: ['error'],
  }
  </script>
