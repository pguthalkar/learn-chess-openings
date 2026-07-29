/**
 * Modern Chess — FEN Engine
 * Board <-> FEN conversion. Pure functions — no module state.
 */
const ChessFEN = (() => {
    'use strict';

    const FEN_PIECE_LETTER = {
        king: 'k', queen: 'q', rook: 'r', bishop: 'b', knight: 'n', pawn: 'p'
    };
    const FEN_LETTER_PIECE = {
        k: CHESS_PIECE_TYPE.KING, q: CHESS_PIECE_TYPE.QUEEN, r: CHESS_PIECE_TYPE.ROOK,
        b: CHESS_PIECE_TYPE.BISHOP, n: CHESS_PIECE_TYPE.KNIGHT, p: CHESS_PIECE_TYPE.PAWN
    };

    function boardToFEN(board, activeColor, castlingRights, enPassantTarget, halfmoveClock, fullmoveNumber) {
        const ranks = [];
        for (let row = 7; row >= 0; row--) {
            let rank = '';
            let empty = 0;
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (!piece) { empty++; continue; }
                if (empty > 0) { rank += String(empty); empty = 0; }
                const letter = FEN_PIECE_LETTER[piece.type];
                rank += (piece.player === CHESS_PLAYER.ONE) ? letter.toUpperCase() : letter;
            }
            if (empty > 0) rank += String(empty);
            ranks.push(rank);
        }
        const placement = ranks.join('/');
        const active = (activeColor === CHESS_PLAYER.ONE) ? 'w' : 'b';
        let castling = '';
        if (castlingRights.whiteKing) castling += 'K';
        if (castlingRights.whiteQueen) castling += 'Q';
        if (castlingRights.blackKing) castling += 'k';
        if (castlingRights.blackQueen) castling += 'q';
        if (castling === '') castling = '-';
        const enPassant = enPassantTarget
            ? String.fromCharCode(97 + enPassantTarget.col) + String(enPassantTarget.row + 1)
            : '-';
        return `${placement} ${active} ${castling} ${enPassant} ${halfmoveClock} ${fullmoveNumber}`;
    }

    function fenToBoard(fen) {
        const parts = fen.split(' ');
        const placement = parts[0], active = parts[1], castling = parts[2], enPassant = parts[3];
        const halfmoveClock = parts[4], fullmoveNumber = parts[5];
        const board = Array.from({ length: 8 }, () => Array(8).fill(null));
        const ranks = placement.split('/');
        for (let i = 0; i < 8; i++) {
            const row = 7 - i;
            const rank = ranks[i];
            let col = 0;
            for (let j = 0; j < rank.length; j++) {
                const ch = rank[j];
                if (ch >= '1' && ch <= '8') { col += Number(ch); continue; }
                const type = FEN_LETTER_PIECE[ch.toLowerCase()];
                const player = (ch === ch.toUpperCase()) ? CHESS_PLAYER.ONE : CHESS_PLAYER.TWO;
                board[row][col] = { type, player, moved: false };
                col++;
            }
        }
        const activeColor = (active === 'w') ? CHESS_PLAYER.ONE : CHESS_PLAYER.TWO;
        const castlingRights = {
            whiteKing: castling.includes('K'),
            whiteQueen: castling.includes('Q'),
            blackKing: castling.includes('k'),
            blackQueen: castling.includes('q')
        };
        const enPassantTarget = (enPassant === '-') ? null
            : { row: Number(enPassant[1]) - 1, col: enPassant.charCodeAt(0) - 97 };
        return {
            board, activeColor, castlingRights, enPassantTarget,
            halfmoveClock: Number(halfmoveClock), fullmoveNumber: Number(fullmoveNumber)
        };
    }

    function deriveCastlingRights(board) {
        const whiteKing = board[0][4];
        const whiteRookK = board[0][7];
        const whiteRookQ = board[0][0];
        const blackKing = board[7][4];
        const blackRookK = board[7][7];
        const blackRookQ = board[7][0];
        return {
            whiteKing: !!(whiteKing && whiteKing.type === CHESS_PIECE_TYPE.KING && !whiteKing.moved &&
                whiteRookK && whiteRookK.type === CHESS_PIECE_TYPE.ROOK && !whiteRookK.moved),
            whiteQueen: !!(whiteKing && whiteKing.type === CHESS_PIECE_TYPE.KING && !whiteKing.moved &&
                whiteRookQ && whiteRookQ.type === CHESS_PIECE_TYPE.ROOK && !whiteRookQ.moved),
            blackKing: !!(blackKing && blackKing.type === CHESS_PIECE_TYPE.KING && !blackKing.moved &&
                blackRookK && blackRookK.type === CHESS_PIECE_TYPE.ROOK && !blackRookK.moved),
            blackQueen: !!(blackKing && blackKing.type === CHESS_PIECE_TYPE.KING && !blackKing.moved &&
                blackRookQ && blackRookQ.type === CHESS_PIECE_TYPE.ROOK && !blackRookQ.moved)
        };
    }

    return { boardToFEN, fenToBoard, deriveCastlingRights };
})();
