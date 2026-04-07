export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>电子冰箱 Server</h1>
      <p>服务端骨架已初始化。</p>
      <p>可用接口：</p>
      <ul>
        <li>GET /api/items</li>
        <li>POST /api/items</li>
        <li>DELETE /api/items/:id</li>
      </ul>
    </main>
  );
}
