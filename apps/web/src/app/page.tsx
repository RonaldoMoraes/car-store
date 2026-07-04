export default function PlatformHome() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center text-white">
      <h1 className="text-4xl font-bold tracking-tight">
        Sua revenda, sua marca.
      </h1>
      <p className="max-w-xl text-lg text-zinc-400">
        Sites e aplicativo para revendas de veículos — estoque, leads e Tabela
        FIPE em uma única plataforma, com a identidade da sua loja.
      </p>
      <p className="text-sm text-zinc-600">
        Plataforma em construção · demo local:{" "}
        <a className="underline" href="http://demo.localhost:3000">
          demo.localhost:3000
        </a>
      </p>
    </main>
  );
}
