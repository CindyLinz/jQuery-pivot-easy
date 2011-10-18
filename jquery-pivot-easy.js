/*!
  * jQuery Menu Skeleton Library v0.01
  * https://github.com/CindyLinz/jQuery-pivot-easy
  *
  * Copyright 2011, Cindy Wang (CindyLinz)
  * Dual licensed under the MIT or GPL Version 2 licenses.
  *
  * Date: 2011.10.18
  */
(function($){
    function build_field_tree(root, data, fields, depth){
        if( depth>=fields.length )
            return 1;
        var f = fields[depth].field;
        var data_group = {};
        $.each(data, function(){
            if( !data_group[this[f]] )
                data_group[this[f]] = [];
            data_group[this[f]].push(this);
        });
        var value_order = {};
        var i = 0, value;
        if( fields[depth].valueAlias )
            for( value in fields[depth].valueAlias ){
                value_order[value] = i;
                ++i;
            }
        var size = 0;
        $.each($.map(data_group, function(dummy, key){ return key }).sort(function(a,b){
            if( a in value_order )
                if( b in value_order )
                    return value_order[a] - value_order[b];
                else
                    return -1;
            else
                if( b in value_order )
                    return 1;
                else
                    if( a<b )
                        return -1;
                    else if( a>b )
                        return 1;
                    else
                        return 0;
        }), function(){
            root[this] = {};
            size += build_field_tree(root[this], data_group[this], fields, depth+1);
        });
        return size;
    }

    function cell2table(cell){
        var html = '<table cellspacing=0 border=1>';
        var skip = {};
        var r, c;
        for(r=0; r<cell.length; ++r){
            html += '<tr>';
            if( !cell[r] )
                continue;
            for(c=0; c<cell[r].length; ++c){
                if( !skip[r+','+c] ){
                    html += '<td';
                    var rspan = cell[r][c][1];
                    if( rspan>1 )
                        html += ' rowspan='+rspan;
                    else
                        rspan = 1;
                    var cspan = cell[r][c][2];
                    if( cspan>1 )
                        html += ' colspan='+cspan;
                    else
                        cspan = 1;
                    html += '>' + cell[r][c][0];
                    var i, j;
                    for(i=0; i<rspan; ++i)
                        for(j=0; j<cspan; ++j)
                            skip[(r+i)+','+(c+j)] = 1;
                    delete skip[r+','+c];
                }
            }
        }
        html += '</table>';
        return html;
    }

    function put_tree(off_h, off_w, tree, put){
        var w = off_w;
        $.each(tree, function(key){
            var size = put_tree(off_h+1, w, this, put);
            put(key, off_h, w, size);
            w += size;
        });
        if( w==off_w )
            return 1;
        else
            return w - off_w;
    }

    function put(){
        if( arguments.length<3 )
            return;
        var args = $.makeArray(arguments);
        var value = args.pop();
        var cell = args.shift();
        while( args.length>1 ){
            if( !cell[args[0]] )
                cell[args[0]] = [];
            cell = cell[args.shift()];
        }
        cell[args[0]] = value;
    }

    function get(cell, r, c){
        var cell = arguments[0];
        var i;
        for(i=1; i<arguments.length; ++i){
            if( !cell )
                return '';
            cell = cell[arguments[i]];
        }
        return cell;
    }

    function new_cell(height, width, init_value){
        var cell = new Array(height);
        var i, j;
        for(i=0; i<height; ++i){
            cell[i] = new Array(width);
            for(j=0; j<width; ++j)
                cell[i][j] = init_value;
        }
        return cell;
    }

    function keys(obj){
        var key;
        out = [];
        for( key in obj )
            out.push(key);
        return out;
    }

    function group_by_key(data, field, keys){
        var group = {};
        var key;
        var i;
        for(i=0; i<data.length; ++i){
            key = data[i][field];
            if( !group[key] )
                group[key] = [];
            group[key].push(data[i]);
        }

        var out = [];
        for(i=0; i<keys.length; ++i){
            if( group[keys[i]] )
                out.push(group[keys[i]]);
            else
                out.push([]);
        }
        return out;
    }

    function data_enumerator(data, cols, col_tree, rows, row_tree){
        function build(data, col_tree, row_tree, depth){
            var group_keys, group_data;
            if( depth < rows.length ){
                group_keys = keys(row_tree);
                group_data = group_by_key(data, rows[depth].field, group_keys);
            }
            else if( depth < rows.length+cols.length ){
                group_keys = keys(col_tree);
                group_data = group_by_key(data, cols[depth-rows.length].field, group_keys);
            }
            else{
                return [data];
            }

            var i;
            var out = [];
            var child;
            for(i=0; i<group_data.length; ++i){
                if( depth < rows.length )
                    child = build(group_data[i], col_tree, row_tree[group_keys[i]], depth+1);
                else
                    child = build(group_data[i], col_tree[group_keys[i]], row_tree, depth+1);
                out = out.concat(child);
            }
            return out;
        }
        return build(data, col_tree, row_tree, 0);
    }

    function takeAlias(fields, i, field){
        if( fields && fields[i] && fields[i].valueAlias && field in fields[i].valueAlias )
            return fields[i].valueAlias[field];
        else
            return field;
    }

    $.pivotEasy = function(data, cols, rows, renderer){
        var col_tree = {};
        var col_tree_size = build_field_tree(col_tree, data, cols, 0);
        var row_tree = {};
        var row_tree_size = build_field_tree(row_tree, data, rows, 0);

        var cell = new_cell(cols.length+1+row_tree_size, rows.length+1+col_tree_size, ['']);
        cell[0][0] = ['&nbsp;', cols.length, rows.length];

        var i, j;
        for(i=0; i<cols.length; ++i)
            cell[i][rows.length] = [cols[i].label];
        for(i=0; i<rows.length; ++i)
            cell[cols.length][i] = [rows[i].label];

        put_tree(0, rows.length+1, col_tree, function(label, r, c, size){ cell[r][c] = [takeAlias(cols, r, label), 1, size] });
        put_tree(0, cols.length+1, row_tree, function(label, r, c, size){ cell[c][r] = [takeAlias(rows, r, label), size, 1] });

        var data_enum = data_enumerator(data, cols, col_tree, rows, row_tree);
        //alert(JSON.stringify(data_enum)+':'+rows+'|'+cols);
        var cell_data;
        for(i=0; i<row_tree_size; ++i)
            for(j=0; j<col_tree_size; ++j)
                cell[cols.length+1+i][rows.length+1+j] = [renderer(data_enum.shift())];

        return cell2table(cell);
    };
})(jQuery)
