# GitHub'a Yükleme

Yeni boş GitHub deposu oluşturun ve bu klasörün içeriğini depoya yükleyin.

Komut satırı örneği:

```bash
git init
git add .
git commit -m "KORGEM Panda Pig final arcade project"
git branch -M main
git remote add origin <GITHUB_REPO_ADRESI>
git push -u origin main
```

## Windows build

Depo GitHub'a gittikten sonra `Actions > Build Windows Arcade > Run workflow` ile Windows paketleme işi çalıştırılabilir.

Not: GitHub Pages üzerinde açılan web sürümü sadece görsel/yazılım testi içindir. Pico seri portlu kabin sürümü Electron/Windows uygulamasıdır.
