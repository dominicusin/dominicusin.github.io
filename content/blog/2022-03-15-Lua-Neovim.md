---
title: Lua  Neovim
date: "2022-03-15T01:33:00.000Z"
slug: Lua-Neovim
aliases:
  - /2022/03/15/Lua-Neovim.html
---
author: DominicusIn

# Начало работы с Lua в Neovim

## Содержание

* [Введение](#введение)
  * [Изучение языка Lua](#изучение-lua)
  * [Имеющиеся туториалы по написанию плагинов на Lua для Neovim](#имеющиеся-туториалы-по-написанию-плагинов-на-lua-для-neovim)
  * [Связанные плагины](#связанные-плагины)
* [Куда класть файлы Lua](#куда-класть-файлы-lua)
  * [init.lua](#initlua)
  * [Другие файлы Lua](#другие-файлы-lua)
    * [Предостережения](#предостережения)
    * [Советы](#советы)
    * [Заметка относительно пакетов](#заметка-относительно-пакетов)
* [Использование Lua в Vimscript](#использование-lua-в-vimscript)
  * [:lua](#lua)
  * [:luado](#luado)
  * [:luafile](#luafile)
    * [luafile vs require():](#luafile-vs-require)
  * [luaeval()](#luaeval)
  * [v:lua](#vlua)
    * [Предостережения](#предостережения-1)
  * [Советы](#советы-1)
* [Пространство имён vim](#пространство-имён-vim)
    * [Советы](#советы-2)
* [Использование Vimscript из Lua](#Использование-Vimscript-из-Lua)
  * [vim.api.nvim_eval()](#vimapinvim_eval)
    * [Предостережения](#предостережения-2)
  * [vim.api.nvim_exec()](#vimapinvim_exec)
  * [vim.api.nvim_command()](#vimapinvim_command)
    * [Советы](#советы-3)
* [Управление опции vim](#управление-опции-vim)
  * [Использование функций API](#использование-функций-api)
  * [Использование мета-аксессоров](#использование-мета-аксессоров)
    * [Предостережения](#предостережения-3)
* [Управление внутренними переменными vim](#управление-внутренними-переменными-vim)
  * [Использование функций API](#использование-функций-api-1)
  * [Использование мета-аксессоров](#использование-мета-аксессоров-1)
    * [Предостережения](#предостережения-4)
* [Вызов функций Vimscript](#вызов-функций-vimscript)
  * [vim.call()](#vimcall)
  * [vim.fn.{function}()](#vimfnfunction)
    * [Советы](#советы-4)
    * [Предостережения](#предостережения-5)
* [Определение сопоставлений клавиш](#определение-сопоставлений-клавиш)
* [Определение пользовательских команд](#определение-пользовательских-команд)
* [Определение автокоманд](#определение-автокоманд)
* [Определение синтаксиса/подсветки](#определение-синтаксисаподсветки)
* [Общие советы и рекомендации](#общие-советы-и-рекомендации)
  * [Настройка линтеров/языковых серверов](#настройка-линтеровязыковых-серверов)
    * [luacheck](#luacheck)
    * [sumneko/lua-language-server](#sumnekolua-language-server)
    * [coc.nvim](#cocnvim)
* [Разное](#разное)
  * [vim.loop](#vimloop)
  * [vim.lsp](#vimlsp)
  * [vim.treesitter](#vimtreesitter)
  * [Transpilers](#transpilers)

Created by [gh-md-toc](https://github.com/ekalinin/github-markdown-toc)

## Введение

Интеграция Lua в Neovim в качестве языка с первоклассной поддержкой превращает её в одну из важнейших особенностей редактора. Тем не менее, количество учебных материалов по написанию плагинов на Lua значительно меньше таковых на Vimscript.
Это руководство является попыткой предоставления необходимой информации для написания плагинов на Lua.

Это руководство предполагает, что пользователь использует последнюю версию Neovim [nightly build](https://github.com/neovim/neovim/releases/tag/nightly).
Так как версия 0.5 Neovim находится на стадии разработки, имейте в виду, что API, которые находятся в активной разработке нестабильны и могут быть подвержены изменениям до релиза.

### Изучение Lua

Если вы незнакомы с языком, имеется большое количество материалов для изучения:

- Ресурс [Learn X in Y minutes page about Lua](https://learnxinyminutes.com/docs/lua/) позволит вам пробежаться по основам языка
- Если вы предпочитаете видеоуроки, то у Дерека Банаса (Derek Banas) имеется часовой видеоурок [1-hour tutorial on the language](https://www.youtube.com/watch?v=iMacxZQMPXs)
- Сайт [lua-users wiki](http://lua-users.org/wiki/LuaDirectory) содержит большое количество полезной информации относительно Lua
- Сайт [official reference manual for Lua](https://www.lua.org/manual/5.1/) должен дать исчерпывающую информацию о языке

Следует заметить, что Lua является очень чистым и простым языком. Язык легко изучить, особенно если имеется опыт использования аналогичного скриптового языка наподобие Javascript. Возможно, вы разбираетесь в Lua больше, чем вы представляете!

Заметка: версия Lua, встроенное в Neovim является LuaJIT 2.1.0, что поддерживает совместимость с Lua 5.1 (с некоторыми исключениями в виде расширений версии 5.2)

### Имеющиеся туториалы по написанию плагинов на Lua для Neovim

Было написано несколько туториалов, чтобы помочь людям написать плагины на Lua. Некоторые из них значительно помогли для написания этого руководства. Большое спасибо их авторам.

- [teukka.tech - From init.vim to init.lua](https://teukka.tech/luanvim.html)
- [2n.pl - How to write neovim plugins in Lua](https://www.2n.pl/blog/how-to-write-neovim-plugins-in-lua.md)
- [2n.pl - How to make UI for neovim plugins in Lua](https://www.2n.pl/blog/how-to-make-ui-for-neovim-plugins-in-lua)
- [ms-jpq - Neovim Async Tutorial](https://ms-jpq.github.io/neovim-async-tutorial/)

### Связанные плагины

- [Vimpeccable](https://github.com/svermeulen/vimpeccable) - Плагин, помогающий написать .vimrc на Lua
- [plenary.nvim](https://github.com/nvim-lua/plenary.nvim) - Все функции Lua, которые я не хоче переписывать
- [popup.nvim](https://github.com/nvim-lua/popup.nvim) - Имплементация API Всплывающих окон vim(vim Popup API) для Neovim
- [nvim_utils](https://github.com/norcalli/nvim_utils)
- [nvim-luadev](https://github.com/bfredl/nvim-luadev) - REPL/дебаг консоль для плагинов Neovim, написанных на lua
- [nvim-luapad](https://github.com/rafcamlet/nvim-luapad) - Интерактивный Neovim скратчпад для встроенного движка Lua
- [nlua.nvim](https://github.com/tjdevries/nlua.nvim) - Lua Разработка для Neovim
- [BetterLua.vim](https://github.com/euclidianAce/BetterLua.vim) - Лучшая синтаксическая подсветка Lua в Vim/NeoVim 

## Куда класть файлы Lua

### init.lua

Neovim поддерживает загрузку файла `init.lua` вместо `init.vim` для конфигурации.

Для справок:
- `:help config`

### Другие файлы Lua

Файлы Lua обычно находятся внутри папки `lua/` в вашей `runtimepath` (для большинства пользователей это папка `~/.config/nvim/lua` на *nix-овых системах и `~/AppData/Local/nvim/lua` для Windows). Вы можете вызвать эти файлы с помощью `require()` в качестве Lua модулей.

В качестве примера возьмем следующую структуру папок:

```text
📂 ~/.config/nvim
├── 📁 after
├── 📁 ftplugin
├── 📂 lua
│  ├── 🌑 myluamodule.lua
│  └── 📂 other_modules
│     ├── 🌑 anothermodule.lua
│     └── 🌑 init.lua
├── 📁 pack
├── 📁 plugin
├── 📁 syntax
└── 🇻 init.vim
```

Lua код ниже загрузит модуль `myluamodule.lua`:

```lua
require('myluamodule')
```

Заметьте отсутствие расширения файла `.lua`.

Аналогично, загрузка `other_modules/anothermodule.lua` выполняется следующим образом:

```lua
require('other_modules.anothermodule')
-- or
require('other_modules/anothermodule')
```

Разделители путей обозначены либо точкой `.` либо слэшем `/`.

Папка содержащая файл `init.lua` может быть загружена напрямую без необходимости уточнять имя файла.

```lua
require('other_modules') -- загружает other_modules/init.lua
```

Для большей информации: `:help lua-require`

#### Предостережения

В отличие от файлов с расширением .vim, файлы с расширением .lua не загружаются автоматически, если они находятся в специальных папках `runtimepath`. К примеру, Neovim загрузит `plugin/foo.vim`, но не загрузит `plugin/foo.lua`.

Также смотрите:
- [Issue #12670](https://github.com/neovim/neovim/issues/12670)

#### Советы

Некоторые Lua плагины могут имет идентичные имена файлов внутри папки `lua/`. Это может привести к коллизии пространств имён.

Если два плагина имеют файл `lua/main.lua`, То вызов `require('main')` неопределён: какой файл необходимо загрузить?

Поэтому это хорошая идея создать пространство имен вашей конфигурации или плагина с помощью папки в самом верхнем уровне, наподобие: `lua/plugin_name/main.lua`

#### Заметка относительно пакетов

**Обновление**: если вы используете последнюю ночную сборку, это [больше не проблема] (https://github.com/neovim/neovim/pull/13119), и вы можете спокойно пропустить этот раздел.

Если вы используете функцию `packages` или основанного на ней менеджера подключаемых модулей (например, [packer.nvim](https://github.com/wbthomason/packer.nvim), [minpac](https://github.com/k-takata/minpac) или [vim-packager](https://github.com/kristijanhusak/vim-packager/)), при использовании плагинов Lua следует помнить о некоторых вещах.

Пакеты в папке `start` загружаются только после считывания вашего `init.vim`. Это означает, что пакет не добавляется в `runtimepath` до тех пор, пока Neovim не закончит обработку файла. Это может вызвать проблемы, если плагин ожидает, что вы загрузите(`require`)  модуль Lua или вызовете автоматически загружаемую функцию.

Предполагая, что в пакете `start/foo` есть файл `lua/bar.lua`, выполнение кода ниже в `init.vim` вызовет ошибку, потому что `runtimepath` еще не обновлен:

```vim
lua require('bar')
```

Вы должны использовать команду `packadd! foo` перед тем как вызвать модуль через `require`.

```vim
packadd! foo
lua require('bar')
```

Добавление `!` к `packadd` означает, что Neovim поместит пакет в `runtimepath` без загрузки каких-либо скриптов в его папках `plugin` или `ftdetect`.

Также смотрите:
- `:help :packadd`
- [Issue #11409](https://github.com/neovim/neovim/issues/11409)

## Использование Lua в Vimscript

### :lua

Эта команда выполняет фрагмент кода Lua.

```vim
:lua require('myluamodule')
```

Многострочные скрипты возможны с использованием синтаксиса heredoc:

```vim
echo "Here's a bigger chunk of Lua code"

lua << EOF
local mod = require('mymodule')
local tbl = {1, 2, 3}

for k, v in ipairs(tbl) do
    mod.method(v)
end

print(tbl)
EOF
```

Примечание: каждая команда `:lua` имеет свою собственную область видимости, и переменные, объявленные с ключевым словом `local`, недоступны вне команды. Это не сработает:

```vim
:lua local foo = 1
:lua print(foo)
" выводит 'nil' вместо '1'
```

Примечание 2: функция `print()` в Lua ведет себя аналогично команде `:echomsg`. Его вывод сохраняется в истории сообщений и может быть подавлен командой `:silent`.

Также смотрите:

- `:help :lua`
- `:help :lua-heredoc`

### :luado

Эта команда выполняет фрагмент кода Lua, который воздействует на диапазон строк в текущем буфере. Если диапазон не указан, вместо него используется весь буфер. Строка возвращаемая из блока, используется для определения того, чем должна быть заменена каждая строка в диапазоне.

Следующая команда заменит каждую строку в текущем буфере текстом `hello world`:

```vim
:luado return 'hello world'
```

Также предусмотрены две неявные переменные `line` и `linenr`. `line` - это текст строки, по которой выполняется итерация, а `linenr` - ее номер. Следующая команда сделает каждую строку, номер которой делится на 2, в верхний регистр:

```vim
:luado if linenr % 2 == 0 then return line:upper() end
```

Также смотрите:

- `:help :luado`

### :luafile

Эта команда считывает файл Lua.

```vim
:luafile ~/foo/bar/baz/myluafile.lua
```

Эта команда аналогична команде `:source` для файлов .vim или встроенной функции `dofile()` в Lua.

Также смотрите:

- `:help :luafile`

#### luafile vs require():

Вам может быть интересно, в чем разница между `lua require()` и `luafile`, и стоит ли вам использовать одно вместо другого. У них разные варианты использования:

- `require()`:
    - это встроенная функция Lua. Это позволяет вам использовать модульную систему Lua
    - ищет модули в папках `lua` в вашем `runtimepath`
    - отслеживает, какие модули были загружены, и предотвращает повторный парсинг и выполнение скрипта. Если вы измените файл, содержащий код для модуля, и попытаетесь `require()` второй раз во время работы Neovim, модуль на самом деле не будет обновляться
- `:luafile`:
    - является Ex командой. Не поддерживает модули
    - принимает абсолютный или относительный путь к рабочей папке текущего окна
    - выполняет содержимое скрипта независимо от того, выполнялся ли он раньше

`:luafile` также может быть полезен, если вы хотите запустить файл Lua, над которым вы работаете:

```vim
:luafile %
```

### luaeval()

Эта встроенная функция Vimscript оценивает выражение Lua в форме строки и возвращает ее значение. Типы данных Lua автоматически преобразуются в типы Vimscript (и наоборот).

```vim
" Вы можете сохранить результат в переменной
let variable = luaeval('1 + 1')
echo variable
" 2
let concat = luaeval('"Lua".." is ".."awesome"')
echo concat
" 'Lua is awesome'

" Таблицы в виде списков преобразуются в списки Vim.
let list = luaeval('{1, 2, 3, 4}')
echo list[0]
" 1
echo list[1]
" 2
" Обратите внимание, что в отличие от таблиц Lua, списки Vim индексируются с нуля 

" Таблицы в виде словарей конвертируются в словари Vim.
let dict = luaeval('{foo = "bar", baz = "qux"}')
echo dict.foo
" 'bar'

" То же самое для логических значений и значений nil
echo luaeval('true')
" v:true
echo luaeval('nil')
" v:null

" Вы можете создавать алиас в Vimscript для функций Lua.
let LuaMathPow = luaeval('math.pow')
echo LuaMathPow(2, 2)
" 4
let LuaModuleFunction = luaeval('require("mymodule").myfunction')
call LuaModuleFunction()

" Также можно передавать функции Lua в качестве значений функциям Vim.
lua X = function(k, v) return string.format("%s:%s", k, v) end
echo map([1, 2, 3], luaeval("X"))
```

`luaeval()` принимает необязательный второй аргумент, который позволяет передавать данные в выражение. Затем вы можете получить доступ к этим данным из Lua, используя волшебную глобальную переменную `_A`:

```vim
echo luaeval('_A[1] + _A[2]', [1, 1])
" 2

echo luaeval('string.format("Lua is %s", _A)', 'awesome')
" 'Lua is awesome'
```

Также смотрите:
- `:help luaeval()`

### v:lua

Эта глобальная переменная Vim позволяет вам вызывать глобальные функции Lua прямо из Vimscript. Опять же, типы данных Vim преобразуются в типы Lua и наоборот.

```vim
call v:lua.print('Hello from Lua!')
" 'Hello from Lua!'

let scream = v:lua.string.rep('A', 10)
echo scream
" 'AAAAAAAAAA'

" Загрузка модулей работает
call v:lua.require('mymodule').myfunction()

" Как насчет неплохой статусной строки?
lua << EOF
function _G.statusline()
    local filepath = '%f'
    local align_section = '%='
    local percentage_through_file = '%p%%'
    return string.format(
        '%s%s%s',
        filepath,
        align_section,
        percentage_through_file
    )
end
EOF

set statusline=%!v:lua.statusline()

" Также работает в сопоставлениях выражений
lua << EOF
function _G.check_back_space()
    local col = vim.fn.col('.') - 1
    if col == 0 or vim.fn.getline('.'):sub(col, col):match('%s') then
        return true
    else
        return false
    end
end
EOF

inoremap <silent> <expr> <Tab>
    \ pumvisible() ? '\<C-n>' :
    \ v:lua.check_back_space() ? '\<Tab>' :
    \ completion#trigger_completion()
```

Также смотрите:
- `:help v:lua`
- `:help v:lua-call`

#### Предостережения

Эта переменная может использоваться только для вызова функций. Следующий код всегда будет вызывать ошибку:

```vim
" Создание алиасов не работает
let LuaPrint = v:lua.print

" Доступ к словарям не работает
echo v:lua.some_global_dict['key']

" Использование функции в качестве значения не работает
echo map([1, 2, 3], v:lua.global_callback)
```

### Советы

Вы можете получить подсветку синтаксиса Lua внутри файлов .vim, поместив let `g: vimsyn_embed = 'l'` в свой файл конфигурации. См. `:help g:vimsyn_embed` для получения дополнительной информации об этой опции.

## Пространство имён vim

Neovim предоставляет глобальную переменную `vim`, которая служит точкой входа для взаимодействия с её API из Lua. Она предоставляет пользователям расширенную "стандартную библиотеку" функций, а также различные подмодули.

Некоторые примечательные функции и модули включают:

- `vim.inspect`: вывод Lua объектов (полезно для проверки таблиц)
- `vim.regex`: использование регулярных выражений Vim из Lua
- `vim.api`: модуль, который предоставляет функции API (тот же API, что используют удалённые(remote) плагины)
- `vim.loop`: модуль, который предоставляет функционал цикла событий Neovim (с использованием LibUV)
- `vim.lsp`: модуль, который управляет встроенным клиентом LSP
- `vim.treesitter`: модуль, который предоставляет функционал библиотеки tree-sitter

Этот список ни в коем случае не является исчерпывающим. Если вы хотите узнать больше о том, что делает переменная `vim`, `:help lua-stdlib` и `:help lua-vim` вам в помощь :). В качестве альтернативы вы можете выполнить `:lua print (vim.inspect (vim))`, чтобы получить список всех модулей.

#### Советы

Писать `print(vim.inspect(x))` каждый раз, когда вы хотите проверить содержимое объекта, может оказаться довольно утомительным. Возможно, стоит иметь где-нибудь в вашей конфигурации глобальную функцию-оболочку:

```lua
function _G.dump(...)
    local objects = vim.tbl_map(vim.inspect, {...})
    print(unpack(objects))
end
```

Затем вы можете очень быстро проверить содержимое объекта в своем коде или из командной строки:

```lua
dump({1, 2, 3})
```

```vim
:lua dump(vim.loop)
```


Кроме того, вы можете обнаружить, что встроенных функций Lua иногда не хватает по сравнению с тем, что вы найдете в других языках (например, `os.clock()` возвращает значение только в секундах, а не в миллисекундах). Обязательно посмотрите Neovim stdlib (и `vim.fn`, подробнее об этом позже), вероятно, в нем есть то, что вы ищете.

## Использование Vimscript из Lua

### vim.api.nvim_eval()

Эта функция оценивает строку выражения Vimscript и возвращает ее значение. Типы данных Vimscript автоматически преобразуются в типы Lua (и наоборот).

Это Lua-эквивалент функции `luaeval()` в Vimscript.

```lua
-- Типы данных конвертируются правильно
print(vim.api.nvim_eval('1 + 1')) -- 2
print(vim.inspect(vim.api.nvim_eval('[1, 2, 3]'))) -- { 1, 2, 3 }
print(vim.inspect(vim.api.nvim_eval('{"foo": "bar", "baz": "qux"}'))) -- { baz = "qux", foo = "bar" }
print(vim.api.nvim_eval('v:true')) -- true
print(vim.api.nvim_eval('v:null')) -- nil
```

**TODO**: возможно ли, чтобы `vim.api.nvim_eval()` возвращала `funcref`?

#### Предостережения

В отличие от `luaeval()`, `vim.api.nvim_eval()` не предоставляет неявную переменную `_A` для передачи данных в выражение.

### vim.api.nvim_exec()

Эта функция оценивает фрагмент кода Vimscript. Она принимает строку, содержащую исходный код для выполнения, и логическое значение, чтобы определить, должен ли вывод кода возвращаться функцией (вы можете сохранить вывод в переменной, для примера).

```lua
local result = vim.api.nvim_exec(
[[
let mytext = 'hello world'

function! MyFunction(text)
    echo a:text
endfunction

call MyFunction(mytext)
]],
true)

print(result) -- 'hello world'
```

**TODO**: в документации указано, что  скриптовая область действия(`s:`) поддерживается, но запуск этого фрагмента с переменной скриптовой области действия  вызывает ошибку. Почему?

### vim.api.nvim_command()

Эта функция выполняет команду ex. Она принимает строку, содержащую команду для выполнения.

```lua
vim.api.nvim_command('new')
vim.api.nvim_command('wincmd H')
vim.api.nvim_command('set nonumber')
vim.api.nvim_command('%s/foo/bar/g')
```

Примечание: `vim.cmd` - более короткий alias для этой функции.

```lua
vim.cmd('buffers')
```

#### Советы

Поскольку вам нужно передавать строки этим функциям, вам часто приходится экранировать обратный слэш:

```lua
vim.cmd('%s/\\Vfoo/bar/g')
```

Строковые литералы проще использовать, поскольку они не требуют экранирующих символов:

```lua
vim.cmd([[%s/\Vfoo/bar/g]])
```

## Управление опции vim

### Использование функций API

Neovim предоставляет набор функций API для изменения опции или получения её текущего значения:

- Глобальные опции:
    - `vim.api.nvim_set_option()`
    - `vim.api.nvim_get_option()`
- Локальные опции буферов:
    - `vim.api.nvim_buf_set_option()`
    - `vim.api.nvim_buf_get_option()`
- Локальные опции окон:
    - `vim.api.nvim_win_set_option()`
    - `vim.api.nvim_win_get_option()`

Они принимают строку, содержащую имя опции, которую нужно установить / получить, а также значение, которое вы хотите установить.

Логические параметры (например, `(no)number`) должны иметь значение `true` или `false`:

```lua
vim.api.nvim_set_option('smarttab', false)
print(vim.api.nvim_get_option('smarttab')) -- false
```

Неудивительно, что параметры строки должны быть строками:

```lua
vim.api.nvim_set_option('selection', 'exclusive')
print(vim.api.nvim_get_option('selection')) -- 'exclusive'
```

Числовые опции принимают число:

```lua
vim.api.nvim_set_option('updatetime', 3000)
print(vim.api.nvim_get_option('updatetime')) -- 3000
```

Локальные опции буффера и окна также нуждаются в номере буфера или номере окна (использование `0` установит/получит опцию для текущего буфера/окна)

```lua
vim.api.nvim_win_set_option(0, 'number', true)
vim.api.nvim_buf_set_option(10, 'shiftwidth', 4)
print(vim.api.nvim_win_get_option(0, 'number')) -- true
print(vim.api.nvim_buf_get_option(10, 'shiftwidth')) -- 4
```

### Использование мета-аксессоров

Если вы хотите установить параметры более "идиоматическим" способом, доступны несколько мета-аксессуаров. По сути, они обертывают вышеуказанные функции API и позволяют управлять параметрами, как если бы они были переменными:

- `vim.o.{option}`: глобальные опции
- `vim.bo.{option}`: локальные опции буффера
- `vim.wo.{option}`: локальные опции окна

```lua
vim.o.smarttab = false
print(vim.o.smarttab) -- false

vim.bo.shiftwidth = 4
print(vim.bo.shiftwidth) -- 4
```

Вы можете указать номер для опций, локальных для буфера и для локального окна. Если номер не указан, используется текущий буфер / окно:

```lua
vim.bo[4].expandtab = true -- тоже самое что и vim.api.nvim_buf_set_option(4, 'expandtab', true)
vim.wo.number = true -- тоже самое что и vim.api.nvim_win_set_option(0, 'number', true)
```

Также смотрите:
- `:help lua-vim-internal-options`

#### Предостережения

В Lua нет эквивалента команде `:set`, вы либо устанавливаете параметр глобально, либо локально.

Также смотрите:
- `:help :setglobal`
- `:help global-local`

## Управление внутренними переменными vim

### Использование функций API

Как и у параметров, внутренние переменные имеют собственный набор функций API:

- Глобальные переменные (`g:`):
     - `vim.api.nvim_set_var ()`
     - `vim.api.nvim_get_var ()`
     - `vim.api.nvim_del_var ()`
- Переменные буфера (`b:`):
     - `vim.api.nvim_buf_set_var ()`
     - `vim.api.nvim_buf_get_var ()`
     - `vim.api.nvim_buf_del_var ()`
- Оконные переменные (`w:`):
     - `vim.api.nvim_win_set_var ()`
     - `vim.api.nvim_win_get_var ()`
     - `vim.api.nvim_win_del_var ()`
- Переменные вкладки (`t:`):
     - `vim.api.nvim_tabpage_set_var ()`
     - `vim.api.nvim_tabpage_get_var ()`
     - `vim.api.nvim_tabpage_del_var ()`
- Предопределенные переменные Vim (`v:`):
     - `vim.api.nvim_set_vvar ()`
     - `vim.api.nvim_get_vvar ()`

За исключением предопределенных переменных Vim, они также могут быть удалены (команда `:unlet` является эквивалентом в Vimscript). Локальные переменные (`l:`), скриптовые переменные (`s:`) и аргументы функции (`a:`) не могут быть изменены, поскольку они имеют смысл только в контексте Vimscript, Lua имеет свои собственные правила области видимости

Если вы не знакомы с тем, что делают эти переменные, `:help internal-variables` описывает их подробно.

Эти функции принимают строку, содержащую имя переменной для изменения/получения/удаления, а также значение, которое вы хотите установить.

```lua
vim.api.nvim_set_var('some_global_variable', { key1 = 'value', key2 = 300 })
print(vim.inspect(vim.api.nvim_get_var('some_global_variable'))) -- { key1 = "value", key2 = 300 }
vim.api.nvim_del_var('some_global_variable')
```

Переменные, которые ограничены буфером, окном или вкладкой, также получают номер (использование `0` изменит/получит/удалит переменную для текущего буфера/окна/вкладки):

```lua
vim.api.nvim_win_set_var(0, 'some_window_variable', 2500)
vim.api.nvim_tab_set_var(3, 'some_tabpage_variable', 'hello world')
print(vim.api.nvim_win_get_var(0, 'some_window_variable')) -- 2500
print(vim.api.nvim_buf_get_var(3, 'some_tabpage_variable')) -- 'hello world'
vim.api.nvim_win_del_var(0, 'some_window_variable')
vim.api.nvim_buf_del_var(3, 'some_tabpage_variable')
```

### Использование мета-аксессоров

Внутренними переменными можно управлять более интуитивно с помощью этих мета-аксессоров:

- `vim.g.{name}`: глобальные переменные
- `vim.b.{name}`: буферные переменные
- `vim.w.{name}`: переменные окна
- `vim.t.{name}`: переменные вкладки
- `vim.v.{name}`: предопределенные переменные Vim

```lua
vim.g.some_global_variable = {
    key1 = 'value',
    key2 = 300
}

print(vim.inspect(vim.g.some_global_variable)) -- { key1 = "value", key2 = 300 }
```

Чтобы удалить одну из этих переменных, просто присвойте ей `nil`:

```lua
vim.g.some_global_variable = nil
```

#### Предостережения

В отличие от мета-аксессоров опций, вы не можете указать число для переменных с областью буфера/окна/вкладки.

Кроме того, вы не можете добавлять/обновлять/удалять ключи из словаря, хранящегося в одной из этих переменных. Например, этот фрагмент кода Vimscript не работает:

```vim
let g:variable = {}
lua vim.g.variable.key = 'a'
echo g:variable
" {}
```

Это известная проблема:

- [Issue #12544](https://github.com/neovim/neovim/issues/12544)

## Вызов функций Vimscript

### vim.call()

`vim.call()` вызывает функцию Vimscript. Это может быть встроенная функция Vim или пользовательская функция. Опять же, типы данных конвертируются из Lua в Vimscript и обратно.

Она принимает имя функции, за которым следуют аргументы, которые вы хотите передать этой функции:

```lua
print(vim.call('printf', 'Hello from %s', 'Lua'))

local reversed_list = vim.call('reverse', { 'a', 'b', 'c' })
print(vim.inspect(reversed_list)) -- { "c", "b", "a" }

local function print_stdout(chan_id, data, name)
    print(data[1])
end

vim.call('jobstart', 'ls', { on_stdout = print_stdout })

vim.call('my#autoload#function')
```

See also:
- `:help vim.call()`

### vim.fn.{function}()

`vim.fn` does the exact same thing as `vim.call()`, but looks more like a native Lua function call:

```lua
print(vim.fn.printf('Hello from %s', 'Lua'))

local reversed_list = vim.fn.reverse({ 'a', 'b', 'c' })
print(vim.inspect(reversed_list)) -- { "c", "b", "a" }

local function print_stdout(chan_id, data, name)
    print(data[1])
end

vim.fn.jobstart('ls', { on_stdout = print_stdout })
```

Хэши `#` не являются допустимыми символами для идентификаторов в Lua, поэтому функции автозагрузки должны вызываться с таким синтаксисом:

```lua
vim.fn['my#autoload#function']()
```

Также смотрите:
- `:help vim.fn`

#### Советы

Neovim имеет обширную библиотеку мощных встроенных функций, которые очень полезны для плагинов. Смотрите `:help vim-function` для списка в алфавитном порядке и `:help function-list` для списка функций, сгруппированных по темам.

#### Предостережения

Некоторые функции Vim, которые должны возвращать логическое значение `1` или `0`. В Vimscript это не проблема, поскольку `1` истинно, а `0` ложно, что позволяет использовать такие конструкции:

```vim
if has('nvim')
    " do something...
endif
```

Однако в Lua ложными считаются только `false` и `nil`, числа всегда оцениваются как `true`, независимо от их значения. Вы должны явно проверить `1` или `0`:

```lua
if vim.fn.has('nvim') == 1 then
    -- do something...
end
```

## Определение сопоставлений клавиш

Neovim предоставляет список функций API для установки, получения и удаления сопоставлений:

- Для глобальных сопоставлений:
    - `vim.api.nvim_set_keymap()`
    - `vim.api.nvim_get_keymap()`
    - `vim.api.nvim_del_keymap()`
- Для локальных сопоставлений:
    - `vim.api.nvim_buf_set_keymap()`
    - `vim.api.nvim_buf_get_keymap()`
    - `vim.api.nvim_buf_del_keymap()`

Начнем с `vim.api.nvim_set_keymap()` и `vim.api.nvim_buf_set_keymap()`

Первым аргументом, переданным в функцию, является строка, содержащая имя режима, для которого сопоставление будет действовать:

| Строчное значение      | Страница помощи | Затронутые режимы                        | Эквивалент Vimscript |
| ---------------------- | -------------   | ---------------------------------------- | -------------------- |
| `''` (пустая строка)   | `mapmode-nvo`   | Normal, Visual, Select, Operator-pending | `:map`               |
| `'n'`                  | `mapmode-n`     | Normal                                   | `:nmap`              |
| `'v'`                  | `mapmode-v`     | Visual and Select                        | `:vmap`              |
| `'s'`                  | `mapmode-s`     | Select                                   | `:smap`              |
| `'x'`                  | `mapmode-x`     | Visual                                   | `:xmap`              |
| `'o'`                  | `mapmode-o`     | Operator-pending                         | `:omap`              |
| `'!'`                  | `mapmode-ic`    | Insert and Command-line                  | `:map!`              |
| `'i'`                  | `mapmode-i`     | Insert                                   | `:imap`              |
| `'l'`                  | `mapmode-l`     | Insert, Command-line, Lang-Arg           | `:lmap`              |
| `'c'`                  | `mapmode-c`     | Command-line                             | `:cmap`              |
| `'t'`                  | `mapmode-t`     | Terminal                                 | `:tmap`              |

Второй аргумент - это строка, содержащая левую часть отображения (ключ или набор ключей, запускающих команду, определенную в сопоставлении). Пустая строка эквивалентна `<Nop>`, который отключает ключ.

Третий аргумент - это строка, содержащая правую часть сопоставления (команду для выполнения).

Последний аргумент - это таблица, содержащая логические параметры для сопоставления, как определено в `:help :map-arguments` (включая `noremap` и исключая `buffer`).

Сопоставления локальных буферов также принимают номер буфера в качестве первого аргумента (`0` устанавливает сопоставление для текущего буфера).

```lua
vim.api.nvim_set_keymap('n', '<leader><Space>', ':set hlsearch!<CR>', { noremap = true, silent = true })
-- :nnoremap <silent> <leader><Space> :set hlsearch<CR>

vim.api.nvim_buf_set_keymap(0, '', 'cc', 'line(".") == 1 ? "cc" : "ggcc"', { noremap = true, expr = true })
-- :noremap <buffer> <expr> cc line('.') == 1 ? 'cc' : 'ggcc'
```

`vim.api.nvim_get_keymap()` принимает строку, содержащую краткое имя режима, для которого вы хотите получить список сопоставлений (см. таблицу выше). Возвращаемое значение - это таблица, содержащая все глобальные сопоставления для режима.

```lua
print(vim.inspect(vim.api.nvim_get_keymap('n')))
-- :verbose nmap
```

`vim.api.nvim_buf_get_keymap ()` принимает дополнительный номер буфера в качестве своего первого аргумента (`0` получит сопоставления для текущего буфера)

```lua
print(vim.inspect(vim.api.nvim_buf_get_keymap(0, 'i')))
-- :verbose imap <buffer>
```

`vim.api.nvim_del_keymap()` принимает режим и левую часть сопоставления.

```lua
vim.api.nvim_del_keymap('n', '<leader><Space>')
-- :nunmap <leader><Space>
```

Опять же, `vim.api.nvim_buf_del_keymap ()` принимает номер буфера в качестве своего первого аргумента, где `0` представляет текущий буфер.

```lua
vim.api.nvim_buf_del_keymap(0, 'i', '<Tab>')
-- :iunmap <buffer> <Tab>
```

## Определение пользовательских команд

В настоящее время в Lua нет интерфейса для создания пользовательских команд. Тем не менее, планы имеются:

- [Pull request #11613](https://github.com/neovim/neovim/pull/11613)

В настоящее время вам, вероятно, лучше создавать команды в Vimscript.

## Определение автокоманд

Augroup-ы и autcommand-ы еще не имеют интерфейса, но над ним работают:

- [Pull request #12378](https://github.com/neovim/neovim/pull/12378)

А пока вы можете создавать автокоманды в Vimscript или использовать [эту оболочку из norcalli/nvim_utils](https://github.com/norcalli/nvim_utils/blob/master/lua/nvim_utils.lua#L554-L567)

## Определение синтаксиса/подсветки

Синтаксический API все еще находится в стадии разработки. Вот пара указателей:

- [Issue #9876](https://github.com/neovim/neovim/issues/9876)
- [tjdevries/colorbuddy.vim, библиотека для создания цветовых схем в Lua](https://github.com/tjdevries/colorbuddy.vim)
- `:help lua-treesitter`

## Общие советы и рекомендации

### Настройка линтеров/языковых серверов

Если вы используете линтеры и/или языковые серверы для диагностики и автозаполнения для проектов Lua, возможно, вам придется настроить для них параметры, специфичные для Neovim. Вот несколько рекомендуемых настроек для популярных инструментов:

#### luacheck

Вы можете заставить [luacheck](https://github.com/mpeterv/luacheck/) распознать глобал `vim`, поместив эту конфигурацию в `~/.luacheckrc` (или `$XDG_CONFIG_HOME/luacheck/.luacheckrc`):

```lua
globals = {
    "vim",
}
```

Языковой сервер [Alloyed/lua-lsp](https://github.com/Alloyed/lua-lsp/) использует luacheck для обеспечения линтинга и читает тот же файл.

Для получения дополнительной информации о том, как настроить `luacheck`, обратитесь к его [документации](https://luacheck.readthedocs.io/en/stable/config.html)

#### sumneko/lua-language-server

Пример конфигурации для [sumneko/lua-language-server](https://github.com/sumneko/lua-language-server/) (в примере используется встроенный клиент LSP, но конфигурация для другого клиента LSP должна быть идентична):

```lua
require'lspconfig'.sumneko_lua.setup {
    settings = {
        Lua = {
            runtime = {
                -- Заставьте языковой сервер распознавать глобальные переменные LuaJIT, такие как `jit` и` bit`
                version = 'LuaJIT',
                - Настройте путь к lua
                path = vim.split(package.path, ';'),
            },
            diagnostics = {
                - Заставьте языковой сервер распознавать глобальную переменную `vim`
                globals = {'vim'},
            },
            workspace = {
                -- Сделать так, чтобы сервер знал о рантайм файлах Neovim
                library = {
                    [vim.fn.expand('$VIMRUNTIME/lua')] = true,
                    [vim.fn.expand('$VIMRUNTIME/lua/vim/lsp')] = true,
                },
            },
        },
    },
}
```

Для получения дополнительной информации о настройке [sumneko/lua-language-server](https://github.com/sumneko/lua-language-server/) см. ["Setting without VSCode"](https://github.com/sumneko/lua-language-server/wiki/Setting-without-VSCode)

#### coc.nvim

Источник автодополнения [rafcamlet/coc-nvim-lua](https://github.com/rafcamlet/coc-nvim-lua/) для [coc.nvim](https://github.com/neoclide/coc.nvim/) предоставляет элементы автодополнения для библиотеки Neovim stdlib.

**TODO**:

- Горячая перезагрузка модулей
- `vim.validate()`?
- Добавить материал о модульных тестах? Я знаю, что Neovim использует фреймворк [busted](https://olivinelabs.com/busted/), но я не знаю, как использовать его для плагинов.
- Лучшие практики? Я не Lua мастер, поэтому не знаю
- Как использовать пакеты LuaRocks ([wbthomason/packer.nvim](https://github.com/wbthomason/packer.nvim)?)

## Разное

### vim.loop

`vim.loop`- это модуль, который предоставляет API LibUV . Некоторые ресурсы:

- [Official documentation for LibUV](https://docs.libuv.org/en/v1.x/)
- [Luv documentation](https://github.com/luvit/luv/blob/master/docs.md)
- [teukka.tech - Using LibUV in Neovim](https://teukka.tech/vimloop.html)

Также смотрите:
- `:help vim.loop`

### vim.lsp

`vim.lsp` - это модуль, который управляет встроенным клиентом LSP. Репозиторий [neovim/nvim-lspconfig](https://github.com/neovim/nvim-lspconfig/) содержит конфигурации по умолчанию для популярных языковых серверов.

Поведение клиента можно настроить с помощью обработчиков "lsp-handlers". Для дополнительной информации:
- `:help lsp-handler`
- [neovim/neovim#12655](https://github.com/neovim/neovim/pull/12655)
- [How to migrate from diagnostic-nvim](https://github.com/nvim-lua/diagnostic-nvim/issues/73#issue-737897078)

Вы также можете взглянуть на плагины, построенные вокруг клиента LSP:
- [nvim-lua/completion-nvim](https://github.com/nvim-lua/completion-nvim)
- [RishabhRD/nvim-lsputils](https://github.com/RishabhRD/nvim-lsputils)

Также смотрите:
- `:help lsp`

### vim.treesitter

`vim.treesitter` - это модуль, который управляет интеграцией библиотеки [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) в Neovim. Если вы хотите узнать больше о Tree-sitter, вам может быть интересна эта [презентация (38:37)](https://www.youtube.com/watch?v=Jes3bD6P0To).

Организация [nvim-treeitter](https://github.com/nvim-treesitter/) размещает различные плагины, использующие преимущества библиотеки.

See also:
- `:help lua-treesitter`

### Транспайлеры

Одним из преимуществ использования Lua является то, что вам фактически не нужно писать код Lua! Для этого языка доступно множество транспайлеров.

- [Moonscript](https://moonscript.org/)

Вероятно, один из самых известных транспилеров для Lua. Добавляет множество удобных функций, таких как классы, списковое включение или функциональные литералы. Плагин [svermeulen/nvim-moonmaker](https://github.com/svermeulen/nvim-moonmaker) позволяет писать плагины и настройку Neovim непосредственно в Moonscript.

- [Fennel](https://fennel-lang.org/)

Lisp, который компилируется в Lua. Вы можете написать конфигурацию и плагины для Neovim в Fennel с помощью плагина [Olical/aniseed](https://github.com/Olical/aniseed). Кроме того, плагин [Olical/conjure](https://github.com/Olical/conjure) предоставляет интерактивную среду разработки, которая поддерживает Fennel (среди других языков).

Другие интересные проекты:
- [TypeScriptToLua/TypeScriptToLua](https://github.com/TypeScriptToLua/TypeScriptToLua)
- [teal-language/tl](https://github.com/teal-language/tl)
- [Haxe](https://haxe.org/)
- [SwadicalRag/wasm2lua](https://github.com/SwadicalRag/wasm2lua)
- [hengestone/lua-languages](https://github.com/hengestone/lua-languages)