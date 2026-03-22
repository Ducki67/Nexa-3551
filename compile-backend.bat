::compile backend
@echo off
setlocal enabledelayedexpansion
cls
title Compiling Nexa Backend
color 0a
chcp 65001 >nul
echo [+] Compiling Nexa Backend to Prod EXE...

REM Paths
set SCRIPT_DIR=%~dp0
set ROOT=%SCRIPT_DIR:~0,-1%
set SRC=%ROOT%\src
set OUT=%ROOT%\Prod-Release

REM Ensure output folder
if exist "%OUT%" rd /s /q "%OUT%"
mkdir "%OUT%"

echo [*] Using Bun if available to bundle (esbuild) and pkg to create exe.
where bun >nul 2>nul
if %errorlevel%==0 (
    set USE_BUN=1
    echo [*] bun detected.
) else (
    set USE_BUN=0
    echo [!] bun not found. Will fallback to tsc + pkg (requires Node tooling).
)

REM Try bundling with esbuild via bunx if possible
set BUNDLED=0
if %USE_BUN%==1 (
    echo [*] Attempting to bundle with esbuild via bunx...
    pushd "%ROOT%"
    bunx esbuild "src/index.ts" --bundle --platform=node --target=node18 --outfile="%OUT%\index.js" 2>nul
    if %errorlevel%==0 (
        set BUNDLED=1
        echo [+] Bundled with esbuild
    ) else (
        echo [!] bunx esbuild failed, will fallback
    )
    popd
)

if %BUNDLED%==0 (
    echo [*] Falling back to TypeScript compile (tsc)
    pushd "%SRC%"
    if not exist "dist" mkdir "dist"
    tsc
    if errorlevel 1 (
        echo [!] tsc compilation failed!
        pause & exit /b 1
    )
    popd
    REM locate compiled entry
    if exist "%SRC%\dist\index.js" (
        copy /Y "%SRC%\dist\index.js" "%OUT%\index.js" >nul
    ) else if exist "%SRC%\dist\index.mjs" (
        copy /Y "%SRC%\dist\index.mjs" "%OUT%\index.js" >nul
    ) else (
        echo [!] Cannot find compiled output (dist/index.js). Please ensure your tsconfig outputs there.
        pause & exit /b 1
    )
    echo [+] TypeScript compiled and copied to %OUT%\index.js
)

REM Package to exe using pkg (via bunx or npx)
echo [*] Packaging to EXE using pkg...
pushd "%OUT%"
where bun >nul 2>nul
if %errorlevel%==0 (
    bunx pkg "index.js" --targets node18-win-x64 --output "Nexa.exe"
    set PKG_EXIT=%errorlevel%
 ) else (
    where npx >nul 2>nul
    if %errorlevel%==0 (
        npx pkg "index.js" --targets node18-win-x64 --output "Nexa.exe"
        set PKG_EXIT=%errorlevel%
    ) else (
        echo [!] Neither bunx nor npx found. Install bun or Node.js/npm to use pkg.
        popd
        pause & exit /b 1
    )
)

if not %PKG_EXIT%==0 (
    echo [!] pkg failed to create exe (exit %PKG_EXIT%).
    popd
    pause & exit /b 1
)
popd
REM remove temporary JS bundle to keep repository TS-only
if exist "%OUT%\index.js" (
    del /Q "%OUT%\index.js"
    echo [*] Removed temporary JS bundle to keep TS-only source.
)

REM Attempt to create/apply custom icon if present
set ICON_PATH=%ROOT%\icon.ico
if not exist "%ICON_PATH%" set ICON_PATH=%SRC%\icon.ico

REM If no .ico but icon.png exists, try to convert using ImageMagick (magick)
if not exist "%ICON_PATH%" (
    if exist "%ROOT%\icon.png" (
        where magick >nul 2>nul
        if %errorlevel%==0 (
            echo [*] Converting root icon.png -> icon.ico using ImageMagick
            magick convert "%ROOT%\icon.png" -define icon:auto-resize=256,128,64,48,32,16 "%ROOT%\icon.ico"
            if exist "%ROOT%\icon.ico" set ICON_PATH=%ROOT%\icon.ico
        ) else (
            echo [!] ImageMagick (magick) not found; cannot auto-convert icon.png. Install ImageMagick or provide icon.ico
        )
    ) else if exist "%SRC%\icon.png" (
        where magick >nul 2>nul
        if %errorlevel%==0 (
            echo [*] Converting src\icon.png -> icon.ico using ImageMagick
            magick convert "%SRC%\icon.png" -define icon:auto-resize=256,128,64,48,32,16 "%ROOT%\icon.ico"
            if exist "%ROOT%\icon.ico" set ICON_PATH=%ROOT%\icon.ico
        ) else (
            echo [!] ImageMagick (magick) not found; cannot auto-convert src\icon.png. Install ImageMagick or provide icon.ico
        )
    )
)
if exist "%ICON_PATH%" (
    echo [*] Found icon at %ICON_PATH%, attempting to set on EXE (requires rcedit.exe)
    REM Prefer rcedit from PATH, otherwise check repo root or tools/ folder
    set RCEDIT_CMD=
    where rcedit >nul 2>nul && set RCEDIT_CMD=rcedit
    if not defined RCEDIT_CMD if exist "%ROOT%\rcedit.exe" set RCEDIT_CMD="%ROOT%\rcedit.exe"
    if not defined RCEDIT_CMD if exist "%ROOT%\tools\rcedit.exe" set RCEDIT_CMD="%ROOT%\tools\rcedit.exe"
    if defined RCEDIT_CMD (
        %RCEDIT_CMD% "%OUT%\Nexa.exe" --set-icon "%ICON_PATH%"
        if %errorlevel%==0 (
            echo [+] Icon applied to Nexa.exe
        ) else (
            echo [!] rcedit failed to apply icon.
        )
    ) else (
        echo [!] rcedit.exe not found. To set the icon automatically, download rcedit.exe and place it in the repo root or add it to PATH.
        echo [!] Quick PowerShell command to download rcedit:
        echo     Invoke-WebRequest -Uri "https://github.com/electron/rcedit/releases/download/v1.1.1/rcedit-x64.exe" -OutFile rcedit.exe
        echo [!] Then re-run this script.
        echo [!] You can also manually set the icon with Resource Hacker or similar tools.
    )
) else (
    echo [*] No icon.ico found in project root or src. Skipping icon embedding.
)

echo [+] Prod EXE available in %OUT%\Nexa.exe
echo.
pause
