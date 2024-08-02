section .data
message db  'hello world', 0;

section .bss
;

section .text
global _start            ;
_start
_start:
    mov eax, message
    push eax
    call print
    add esp, 4
    mov eax, 1          ; exit call
    xor ebx, ebx        ; exit code 0
    int 0x80            ;  system call
print:
    mov edx, len        ; dynamic string len
    mov ecx, [esp+4]    ; 
    mov ebx, 1          ; File descriptor (stdout)
    mov eax, 4          ;  call number -> sys_write
    int 0x80            ; system call
    ret                 ; Return from the function
section .data
len equ $ - message     ;length is automatically calculated